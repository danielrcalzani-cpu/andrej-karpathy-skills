import type { FieldErrors } from '../shared/domain.ts';

export class ApiError extends Error {
  status: number;
  fields?: FieldErrors;
  constructor(status: number, message: string, fields?: FieldErrors) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}

const OFFLINE_MSG = 'Sem conexão com o servidor. Verifique a internet e tente novamente.';

export async function api<T = any>(path: string, opts: { method?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: opts.method ?? 'GET',
      credentials: 'same-origin',
      headers: {
        'X-Requested-With': 'mercatto',
        ...(opts.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...opts.headers,
      },
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    });
  } catch {
    throw new ApiError(0, OFFLINE_MSG);
  }
  let data: any = null;
  try {
    data = await res.json();
  } catch {
    /* resposta sem JSON */
  }
  if (!res.ok) {
    if (res.status === 401 && path !== '/api/auth/login') window.dispatchEvent(new Event('mercatto:unauthorized'));
    throw new ApiError(res.status, data?.error ?? 'Não foi possível concluir a operação.', data?.fields);
  }
  return data as T;
}

export const post = <T = any>(path: string, body: unknown = {}, headers?: Record<string, string>) => api<T>(path, { method: 'POST', body, headers });
export const put = <T = any>(path: string, body: unknown) => api<T>(path, { method: 'PUT', body });

/** Reduz a foto no aparelho antes do envio (máx. 1600 px, JPEG). */
export async function compressImage(file: File, maxSide = 1600, quality = 0.8): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) throw new Error('Não foi possível ler esta imagem. Tente tirar a foto novamente.');
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Falha ao processar a imagem.'))), 'image/jpeg', quality),
  );
}

/** Envio com progresso (XHR, pois fetch não informa progresso de upload). */
export function uploadPhoto(deliveryId: number, blob: Blob, onProgress: (pct: number) => void): Promise<{ photo_id: number }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/deliveries/${deliveryId}/photos`);
    xhr.setRequestHeader('Content-Type', blob.type || 'image/jpeg');
    xhr.setRequestHeader('X-Requested-With', 'mercatto');
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(Math.round((e.loaded / e.total) * 100));
    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {
        /* ignore */
      }
      if (xhr.status >= 200 && xhr.status < 300 && data?.photo_id) resolve(data);
      else reject(new ApiError(xhr.status, data?.error ?? 'O envio da foto falhou.'));
    };
    xhr.onerror = () => reject(new ApiError(0, 'O envio da foto falhou por falta de conexão.'));
    xhr.send(blob);
  });
}
