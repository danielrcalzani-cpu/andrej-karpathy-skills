"""Extrai e organiza as imagens dos catálogos Mercatto Decor em /public.

Uso: python3 scripts/extract-assets.py <pasta-com-imagens-extraidas> <pasta-com-pdfs>

As imagens de origem foram extraídas com `pdfimages -all -p` (uma subpasta por
catálogo). O mapeamento abaixo foi conferido página a página nos PDFs: cada
textura corresponde ao padrão impresso na mesma página do catálogo.
"""

import shutil
import subprocess
import sys
from pathlib import Path

from PIL import Image

SRC = Path(sys.argv[1])
PDFS = Path(sys.argv[2])
OUT = Path(__file__).resolve().parent.parent / "public"

C, P, V, S, T = (
    "Chateau_Mur_v2_1",
    "Placas_Flexiveis",
    "Pisos_Vinilicos_5_1",
    "Pisos_SPC_2",
    "Teto_Laminado_1",
)

# destino -> (catálogo, arquivo extraído)
MAP = {
    # ---- Château Mur: texturas
    "textures/chateau/248-anglais.jpg": (C, "i-008-019.jpg"),
    "textures/chateau/251-jolie.jpg": (C, "i-008-021.jpg"),
    "textures/chateau/249-marie.jpg": (C, "i-009-023.jpg"),
    "textures/chateau/250-sophie.jpg": (C, "i-009-025.jpg"),
    "textures/chateau/247-troussay.jpg": (C, "i-010-027.jpg"),
    "textures/chateau/coronato-storm-gray.jpg": (C, "i-011-030.jpg"),
    "textures/chateau/coronato-bianco-carrara.jpg": (C, "i-011-032.jpg"),
    "textures/chateau/madeira-mogno-real.jpg": (C, "i-012-034.jpg"),
    "textures/chateau/madeira-carvalho-mel.jpg": (C, "i-012-036.jpg"),
    # ---- Château Mur: ambientes (imagens ilustrativas do catálogo)
    "projects/chateau-banheiro.jpg": (C, "i-001-000.jpg"),
    "projects/chateau-sala.jpg": (C, "i-002-003.jpg"),
    "projects/chateau-quarto.jpg": (C, "i-007-017.jpg"),
    "projects/chateau-troussay-loja.jpg": (C, "i-010-028.jpg"),
    "projects/chateau-mogno-real-jantar.jpg": (C, "i-012-037.jpg"),
    # ---- Placas de revestimento flexível: texturas
    "textures/placas/166-marmore-branco.jpg": (P, "i-007-019.jpg"),
    "textures/placas/172-marmore-cinza.jpg": (P, "i-007-021.jpg"),
    "textures/placas/173-marmore-preto.jpg": (P, "i-008-023.jpg"),
    "textures/placas/295-placa-vinilica-caliza.jpg": (P, "i-008-025.jpg"),
    "textures/placas/169-linho-bege.jpg": (P, "i-010-030.jpg"),
    "textures/placas/170-linho-cinza-claro.jpg": (P, "i-010-032.jpg"),
    "textures/placas/171-linho-cinza-escuro.jpg": (P, "i-011-034.jpg"),
    "textures/placas/191-cinza.jpg": (P, "i-012-037.jpg"),
    "textures/placas/167-black-piano.jpg": (P, "i-012-039.jpg"),
    "textures/placas/168-espelhado.jpg": (P, "i-013-041.jpg"),
    "textures/placas/174-pastilha-cinza.jpg": (P, "i-013-043.jpg"),
    # ---- Placas: ambientes
    "projects/placas-marmore-sala.jpg": (P, "i-001-000.jpg"),
    "projects/placas-marmores.jpg": (P, "i-006-015.jpg"),
    "projects/placas-linhos.jpg": (P, "i-009-026.jpg"),
    "projects/placas-lisos.jpg": (P, "i-011-035.jpg"),
    "projects/placas-171-linho-cinza-escuro-sala.jpg": (P, "i-014-044.jpg"),
    "projects/placas-173-marmore-preto-jantar.jpg": (P, "i-014-045.jpg"),
    "projects/placas-174-pastilha-cinza-banheiro.jpg": (P, "i-014-046.jpg"),
    "projects/placas-167-black-piano-comercial.jpg": (P, "i-014-047.jpg"),
    "projects/placas-tech-fogo.jpg": (P, "i-016-060.jpg"),
    "projects/placas-tech-riscos.jpg": (P, "i-016-061.jpg"),
    "projects/placas-tech-agua.jpg": (P, "i-016-062.jpg"),
    # ---- Piso vinílico colado: texturas (amostras)
    "textures/piso-colado/contenssa.jpg": (V, "i-007-048.jpg"),
    "textures/piso-colado/barone.jpg": (V, "i-007-051.jpg"),
    "textures/piso-colado/duchessa.jpg": (V, "i-008-054.jpg"),
    "textures/piso-colado/imperatore.jpg": (V, "i-008-057.jpg"),
    "textures/piso-colado/capri.jpg": (V, "i-010-061.jpg"),
    "textures/piso-colado/monte-bianco.jpg": (V, "i-010-064.jpg"),
    "textures/piso-colado/branco-imperial.jpg": (V, "i-012-068.jpg"),
    "textures/piso-colado/barao-jacaranda.jpg": (V, "i-012-071.jpg"),
    "textures/piso-colado/castanheira-nobre.jpg": (V, "i-013-074.jpg"),
    "textures/piso-colado/ype-supreme.jpg": (V, "i-013-077.jpg"),
    "textures/piso-colado/platinum-rei.jpg": (V, "i-014-080.jpg"),
    "textures/piso-colado/damasco.jpg": (V, "i-016-085.jpg"),
    "textures/piso-colado/toscana.jpg": (V, "i-016-088.jpg"),
    "textures/piso-colado/caramelo.jpg": (V, "i-017-091.jpg"),
    "textures/piso-colado/damasco-paginado.jpg": (V, "i-002-016.jpg"),
    "textures/piso-colado/toscana-paginado.jpg": (V, "i-003-017.jpg"),
    # ---- Piso vinílico colado: ambientes
    "projects/piso-contenssa-escritorio.jpg": (V, "i-006-046.jpg"),
    "projects/piso-monte-bianco-sala.jpg": (V, "i-009-059.jpg"),
    "projects/piso-barao-jacaranda-jantar.jpg": (V, "i-011-066.jpg"),
    "projects/piso-toscana-sala.jpg": (V, "i-015-083.jpg"),
    # ---- Piso SPC: texturas
    "textures/spc/caparao.jpg": (S, "i-007-021.jpg"),
    "textures/spc/bocaina.jpg": (S, "i-008-026.jpg"),
    "textures/spc/canastra.jpg": (S, "i-009-031.jpg"),
    "textures/spc/freijo.jpg": (S, "i-011-037.jpg"),
    # ---- Piso SPC: ambientes
    "projects/spc-serras-lounge.jpg": (S, "i-006-019.jpg"),
    "projects/spc-madeiras-brasileiras-jantar.jpg": (S, "i-010-035.jpg"),
    # ---- Teto laminado: texturas
    "textures/teto/padrao-01.jpg": (T, "i-005-011.jpg"),
    "textures/teto/padrao-02.jpg": (T, "i-006-016.jpg"),
    "textures/teto/padrao-03.jpg": (T, "i-007-021.jpg"),
    "textures/teto/padrao-04.jpg": (T, "i-008-026.jpg"),
    "textures/teto/padrao-05.jpg": (T, "i-009-031.jpg"),
    "textures/teto/padrao-06.jpg": (T, "i-010-036.jpg"),
    "textures/teto/padrao-07.jpg": (T, "i-011-041.jpg"),
    # ---- Teto laminado: ambientes
    "projects/teto-recepcao.jpg": (T, "i-002-010.jpg"),
    "projects/teto-01-banheiro.jpg": (T, "i-005-015.jpg"),
    "projects/teto-02-sala-de-estar.jpg": (T, "i-006-020.jpg"),
    "projects/teto-03-restaurante.jpg": (T, "i-007-025.jpg"),
    "projects/teto-04-area-gourmet.jpg": (T, "i-008-030.jpg"),
    "projects/teto-05-escritorio.jpg": (T, "i-009-035.jpg"),
    "projects/teto-06-banheiro.jpg": (T, "i-010-040.jpg"),
    "projects/teto-07-sala-de-jantar.jpg": (T, "i-011-045.jpg"),
}

MAX = 2000  # px no lado maior; o next/image gera os tamanhos responsivos


def save_jpg(im: Image.Image, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    im = im.convert("RGB")
    im.thumbnail((MAX, MAX), Image.LANCZOS)
    im.save(dest, "JPEG", quality=84, optimize=True, progressive=True)


for dest, (cat, name) in MAP.items():
    save_jpg(Image.open(SRC / cat / name), OUT / dest)

# Recortes das fotos de ambiente das páginas 14 e 17 do catálogo de piso colado
# (essas fotos só existem compostas na página; recortadas de um render a 220 dpi).
for name in ("platinum-rei-quarto", "caramelo-comercial"):
    crop = SRC.parent / f"{name}.jpg"
    if crop.exists():
        save_jpg(Image.open(crop), OUT / f"projects/piso-{name}.jpg")

# Logo: imagem RGB + máscara de transparência (smask) do PDF.
brand = OUT / "brand"
brand.mkdir(parents=True, exist_ok=True)
for out_name, rgb, mask in (
    ("logo-mercatto-decor.png", "i-001-001.png", "i-001-002.png"),  # M escuro
    ("logo-mercatto-decor-claro.png", "i-017-040.png", "i-017-041.png"),  # M claro
):
    im = Image.open(SRC / C / rgb).convert("RGB")
    im.putalpha(Image.open(SRC / C / mask).convert("L"))
    im = im.crop(im.getbbox())
    im.save(brand / out_name, optimize=True)

# Catálogos em PDF + capas (primeira página renderizada).
catalogs = OUT / "catalogos"
covers = OUT / "catalogs-covers"
catalogs.mkdir(parents=True, exist_ok=True)
covers.mkdir(parents=True, exist_ok=True)
for pdf, slug in (
    ("Chateau_Mur_v2_1.pdf", "chateau-mur"),
    ("Placas_Flexiveis.pdf", "placas-revestimento-flexivel"),
    ("Pisos_Vinilicos_5_1.pdf", "piso-vinilico-colado"),
    ("Pisos_SPC_2.pdf", "piso-vinilico-spc"),
    ("Teto_Laminado_1.pdf", "teto-laminado"),
):
    shutil.copyfile(PDFS / pdf, catalogs / f"mercatto-decor-{slug}.pdf")
    tmp = covers / slug
    subprocess.run(
        ["pdftoppm", "-r", "110", "-f", "1", "-l", "1", "-png", "-singlefile", str(PDFS / pdf), str(tmp)],
        check=True,
    )
    save_jpg(Image.open(f"{tmp}.png"), covers / f"{slug}.jpg")
    Path(f"{tmp}.png").unlink()

print("ok")
