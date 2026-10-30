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

/** Endereço para exibir a foto de um comprovante. */
export const photoUrl = (photoId: number | string) => `/api/photos/${photoId}`;

/** Baixa a cópia de segurança completa (JSON). */
export function exportBackup() {
  const a = document.createElement('a');
  a.href = '/api/export';
  a.download = '';
  document.body.appendChild(a);
  a.click();
  a.remove();
  return Promise.resolve();
}

export { compressImage } from './image.ts';

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
