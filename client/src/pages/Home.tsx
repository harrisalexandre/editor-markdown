/**
 * Oficina Editorial: painel assimétrico de estrutura, escrita e prova impressa.
 * O manuscrito e a página em papel são a prioridade visual deste arquivo.
 */
import DOMPurify from "dompurify";
import JSZip from "jszip";
import { marked } from "marked";
import {
  Archive,
  BookMarked,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileArchive,
  FileDown,
  FileText,
  FolderOpen,
  GripVertical,
  Image as ImageIcon,
  LayoutTemplate,
  ListTree,
  LoaderCircle,
  MoreHorizontal,
  PanelLeft,
  PenLine,
  Plus,
  Printer,
  Settings2,
  Sparkles,
  Type,
  Upload,
  X,
} from "lucide-react";
import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Tab = "editar" | "montar" | "configurar";
type ExportScope = "livro" | "capitulo" | "ato";
type PageFormat = "A4" | "A5" | "Carta" | "Custom";
type PageNumberPosition = "footer-center" | "footer-left" | "footer-right" | "header-left" | "header-center" | "header-right";

type Chapter = {
  id: string;
  path: string;
  title: string;
  act: string;
  content: string;
  included: boolean;
};

type BookMeta = {
  title: string;
  author: string;
  description: string;
};

type StoredAsset = {
  path: string;
  file: File;
};

type PrintSettings = {
  pageFormat: PageFormat;
  customWidth: number;
  customHeight: number;
  marginTop: number;
  marginBottom: number;
  marginSide: number;
  bodyFont: "Source Serif 4" | "Georgia" | "Merriweather";
  titleFont: "Playfair Display" | "Cormorant Garamond" | "Georgia";
  fontSize: number;
  lineHeight: number;
  paragraphIndent: number;
  includeCover: boolean;
  includeToc: boolean;
  includeActs: boolean;
  includeNumbers: boolean;
  includeHeader: boolean;
  pageNumberPosition: PageNumberPosition;
  bodyColor: string;
  paperColor: string;
  accentColor: string;
  dropCapEnabled: boolean;
  dropCapFont: "Playfair Display" | "Cormorant Garamond" | "Georgia";
  dropCapColor: string;
  dropCapLines: number;
  scope: ExportScope;
};

type ImportEntry = { path: string; file: File };
type LocalProjectSnapshot = {
  version: 1;
  savedAt: string;
  hasProject: boolean;
  metadata: BookMeta;
  chapters: Chapter[];
  settings: PrintSettings;
  activeId: string;
  openActs: Record<string, boolean>;
  imageCount: number;
};

// Oficina Editorial: no GitHub Pages, os recursos vivem em public/assets; no preview, usam o armazenamento do projeto.
const pageAsset = (filename: string, manusPath: string) => import.meta.env.BASE_URL === "/" ? manusPath : `${import.meta.env.BASE_URL}assets/${filename}`;
const BRAND_LOGO = pageAsset("caderno-colophon-logo.png", "/manus-storage/caderno-colophon-logo_a0dc4c33.png");
const WELCOME_IMAGE = pageAsset("editorial-workbench-welcome.jpg", "/manus-storage/editorial-workbench-welcome_606eee42.jpg");
const DEFAULT_COVER = pageAsset("folio-abstract-cover.jpg", "/manus-storage/folio-abstract-cover_d8d1fef8.jpg");
const PAPER_TEXTURE = pageAsset("printing-forms-texture.jpg", "/manus-storage/printing-forms-texture_ffb0287d.jpg");
const LOCAL_PROJECT_KEY = "caderno.local-project.v1";

const defaultPrintSettings: PrintSettings = {
  pageFormat: "A5",
  customWidth: 148,
  customHeight: 210,
  marginTop: 20,
  marginBottom: 22,
  marginSide: 18,
  bodyFont: "Source Serif 4",
  titleFont: "Playfair Display",
  fontSize: 11.5,
  lineHeight: 1.62,
  paragraphIndent: 6,
  includeCover: true,
  includeToc: true,
  includeActs: true,
  includeNumbers: true,
  includeHeader: true,
  pageNumberPosition: "footer-center",
  bodyColor: "#38352f",
  paperColor: "#fbf8f0",
  accentColor: "#b64036",
  dropCapEnabled: false,
  dropCapFont: "Playfair Display",
  dropCapColor: "#b64036",
  dropCapLines: 3,
  scope: "livro",
};

const SAMPLE_CHAPTERS: Chapter[] = [
  {
    id: "prologo",
    path: "prologo.md",
    title: "Prólogo — A margem da manhã",
    act: "Prelúdio",
    included: true,
    content: `A casa ainda dormia quando Lia abriu a primeira caixa. Havia nela um mapa dobrado tantas vezes que já não era possível saber onde começava a viagem.

> Todo livro nasce de uma coisa que se recusa a ficar em silêncio.

Ela encostou a palma da mão sobre o papel e percebeu que algumas histórias não pedem licença para entrar.`,
  },
  {
    id: "capitulo-1",
    path: "capitulo-01.md",
    title: "Capítulo 1 — O que se guarda",
    act: "Ato I — Matéria",
    included: true,
    content: `A primeira regra do arquivo era simples: **nada deveria ser perdido**. A segunda, muito mais difícil, era escolher o que merecia permanecer.

Lia criou uma pilha para cartas, uma para fotografias e outra para os objetos que ainda não tinham nome. Entre elas, uma pequena bússola apontava sempre para oeste.

---

No fim da tarde, ela escreveu no caderno: *guardar também é editar*.`,
  },
  {
    id: "capitulo-2",
    path: "capitulo-02.md",
    title: "Capítulo 2 — Cartografia íntima",
    act: "Ato I — Matéria",
    included: true,
    content: `Os mapas antigos têm uma delicadeza especial: deixam espaço para os monstros e para o desconhecido. Lia preferia essa honestidade à precisão das telas.

1. Primeiro, ela marcou as casas.
2. Depois, os nomes que já não eram ditos.
3. Por fim, desenhou um rio onde havia apenas memória.

O caminho ainda não existia, mas o livro já começava a saber para onde ia.`,
  },
  {
    id: "capitulo-3",
    path: "capitulo-03.md",
    title: "Capítulo 3 — Prova de impressão",
    act: "Ato II — Forma",
    included: true,
    content: `Quando recebeu a primeira prova, Lia leu em pé. Não por ansiedade, mas porque um texto muda de peso quando se torna página.


As margens largas ofereciam um lugar para respirar. As palavras, finalmente, tinham onde ficar.`,
  },
];

const normalizePath = (value: string) => value.replaceAll("\\", "/").replace(/^\.\//, "");
const isMarkdown = (path: string) => /\.md(?:own)?$/i.test(path);
const isImage = (path: string) => /\.(png|jpe?g|svg|webp|gif)$/i.test(path);
const isCoverPath = (path: string) => /(^|\/)(capa|cover)(\.|[-_])/i.test(path);
const baseName = (path: string) => path.split("/").at(-1) ?? path;
const mimeFromPath = (path: string) => {
  const extension = path.split(".").at(-1)?.toLowerCase();
  const types: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", svg: "image/svg+xml", webp: "image/webp", gif: "image/gif" };
  return types[extension ?? ""] ?? "application/octet-stream";
};
const titleFromPath = (path: string) =>
  baseName(path)
    .replace(/\.md(?:own)?$/i, "")
    .replace(/^\d+[._ -]*/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
const pageDimensions = (settings: PrintSettings) => {
  if (settings.pageFormat === "A4") return { width: 210, height: 297, label: "A4" };
  if (settings.pageFormat === "Carta") return { width: 216, height: 279, label: "Carta" };
  if (settings.pageFormat === "Custom") {
    return { width: settings.customWidth, height: settings.customHeight, label: `${settings.customWidth} × ${settings.customHeight} mm` };
  }
  return { width: 148, height: 210, label: "A5" };
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 800);
}

function markdownWithLocalImages(source: string, assetUrls: Record<string, string>) {
  return source.replace(/!\[([^\]]*)\]\(([^\s)]+)(?:\s+["']([^"']*)["'])?\)/g, (_match, alt, rawPath, title) => {
    const normalized = normalizePath(decodeURIComponent(rawPath));
    const sourceUrl = assetUrls[normalized] ?? assetUrls[`assets/${normalized.replace(/^assets\//, "")}`] ?? rawPath;
    return `![${alt}](${sourceUrl}${title ? ` "${title}"` : ""})`;
  });
}

function renderedMarkdown(source: string, assetUrls: Record<string, string>, displayedTitle?: string, stripFirstHeading = false) {
  const firstHeading = source.match(/^\s*#\s+(.+?)\s*(?:\r?\n|$)/);
  const content = firstHeading && (stripFirstHeading || (displayedTitle && firstHeading[1].trim().toLocaleLowerCase("pt-BR") === displayedTitle.trim().toLocaleLowerCase("pt-BR")))
    ? source.slice(firstHeading[0].length).replace(/^\s*\r?\n/, "")
    : source;
  const html = marked.parse(markdownWithLocalImages(content, assetUrls), { async: false, breaks: true, gfm: true }) as string;
  return DOMPurify.sanitize(html, {
    ADD_ATTR: ["target"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|ftp|tel|data|blob):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  });
}

const xmlEscape = (value: string) => value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
const epubSafePath = (value: string) => normalizePath(value).replace(/^(?:\.\.\/)+/, "").replace(/^\/+/, "");
const epubFilename = (value: string) => (value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase() || "livro");
const xhtmlize = (html: string) => html
  .replace(/<br\s*\/?>/gi, "<br />")
  .replace(/<hr\s*\/?>/gi, "<hr />")
  .replace(/<img\b([^>]*)>/gi, (_match, attributes) => `<img${String(attributes).replace(/\/\s*$/, "").trimEnd()} />`);

function epubChapterMarkup(chapter: Chapter, imageHrefs: Record<string, string>) {
  const content = xhtmlize(renderedMarkdown(chapter.content, imageHrefs, chapter.title, true));
  return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-BR" lang="pt-BR">
  <head><title>${xmlEscape(chapter.title)}</title><link rel="stylesheet" type="text/css" href="../styles/book.css" /></head>
  <body><article class="chapter"><h1>${xmlEscape(chapter.title)}</h1>${content}</article></body>
</html>`;
}

function groupChapters(chapters: Chapter[]) {
  const groups: { act: string; chapters: Chapter[] }[] = [];
  chapters.forEach((chapter) => {
    const act = chapter.act.trim() || "Sem seção";
    const last = groups.at(-1);
    if (last?.act === act) last.chapters.push(chapter);
    else groups.push({ act, chapters: [chapter] });
  });
  return groups;
}

export default function Home() {
  const zipInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const createdUrlsRef = useRef<string[]>([]);
  const localStorageReadyRef = useRef(false);
  const [tab, setTab] = useState<Tab>("editar");
  const [hasProject, setHasProject] = useState(false);
  const [metadata, setMetadata] = useState<BookMeta>({ title: "", author: "", description: "" });
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [assets, setAssets] = useState<StoredAsset[]>([]);
  const [assetUrls, setAssetUrls] = useState<Record<string, string>>({});
  const [activeId, setActiveId] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [openActs, setOpenActs] = useState<Record<string, boolean>>({});
  const [loadingImport, setLoadingImport] = useState(false);
  const [isDropTarget, setIsDropTarget] = useState(false);
  const [exportingEpub, setExportingEpub] = useState(false);
  const [lastLocalSave, setLastLocalSave] = useState<string | null>(null);
  const [restoredImageCount, setRestoredImageCount] = useState(0);
  const [settings, setSettings] = useState<PrintSettings>(defaultPrintSettings);

  const activeChapter = chapters.find((chapter) => chapter.id === activeId) ?? chapters[0];
  const groups = useMemo(() => groupChapters(chapters), [chapters]);
  const dimensions = pageDimensions(settings);
  const coverUrl = useMemo(() => {
    const cover = Object.entries(assetUrls).find(([path]) => /(^|\/)(capa|cover)(\.|[-_])/i.test(path));
    return cover?.[1] ?? DEFAULT_COVER;
  }, [assetUrls]);

  useEffect(() => {
    folderInputRef.current?.setAttribute("webkitdirectory", "");
    folderInputRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    return () => createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(LOCAL_PROJECT_KEY);
      if (!raw) return;
      const snapshot = JSON.parse(raw) as Partial<LocalProjectSnapshot>;
      if (snapshot.version !== 1 || !snapshot.hasProject || !Array.isArray(snapshot.chapters) || !snapshot.metadata) return;
      setMetadata(snapshot.metadata);
      setChapters(snapshot.chapters);
      setSettings({ ...defaultPrintSettings, ...snapshot.settings });
      setActiveId(snapshot.activeId || snapshot.chapters[0]?.id || "");
      setOpenActs(snapshot.openActs ?? {});
      setHasProject(true);
      setLastLocalSave(snapshot.savedAt ?? null);
      setRestoredImageCount(snapshot.imageCount ?? 0);
      toast.success("Rascunho local restaurado neste navegador.");
    } catch {
      window.localStorage.removeItem(LOCAL_PROJECT_KEY);
    } finally {
      localStorageReadyRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (!localStorageReadyRef.current || !hasProject) return;
    const handle = window.setTimeout(() => {
      const savedAt = new Date().toISOString();
      const snapshot: LocalProjectSnapshot = { version: 1, savedAt, hasProject, metadata, chapters, settings, activeId, openActs, imageCount: assets.length };
      try {
        window.localStorage.setItem(LOCAL_PROJECT_KEY, JSON.stringify(snapshot));
        setLastLocalSave(savedAt);
      } catch {
        toast.error("O navegador não conseguiu salvar este rascunho localmente.");
      }
    }, 650);
    return () => window.clearTimeout(handle);
  }, [activeId, assets.length, chapters, hasProject, metadata, openActs, settings]);

  const updateChapter = useCallback((id: string, changes: Partial<Chapter>) => {
    setChapters((current) => current.map((chapter) => (chapter.id === id ? { ...chapter, ...changes } : chapter)));
  }, []);

  const releaseAssetUrls = () => {
    createdUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    createdUrlsRef.current = [];
  };

  const hydrateProject = async (entries: ImportEntry[]) => {
    const normalizedEntries = entries.map(({ path, file }) => ({ path: normalizePath(path), file }));
    const markdownEntries = normalizedEntries.filter((entry) => isMarkdown(entry.path));
    if (!markdownEntries.length) throw new Error("Não encontrei arquivos .md na seleção.");

    const indexEntry = normalizedEntries.find((entry) => baseName(entry.path).toLowerCase() === "index.json");
    let index: { titulo?: string; autor?: string; descricao?: string; capitulos?: { arquivo: string; titulo?: string; ato?: string }[] } | undefined;
    if (indexEntry) {
      try {
        index = JSON.parse(await indexEntry.file.text());
      } catch {
        toast.warning("O index.json não pôde ser lido. A ordem dos arquivos foi criada automaticamente.");
      }
    }

    const fileByPath = new Map(markdownEntries.map((entry) => [normalizePath(entry.path), entry]));
    const usedPaths = new Set<string>();
    const buildChapter = async (entry: ImportEntry, order: number, indexData?: { titulo?: string; ato?: string }) => ({
      id: `${entry.path}-${order}-${Date.now()}`,
      path: entry.path,
      title: indexData?.titulo?.trim() || titleFromPath(entry.path),
      act: indexData?.ato?.trim() || "Manuscrito",
      content: await entry.file.text(),
      included: true,
    });

    const orderedChapters: Chapter[] = [];
    if (index?.capitulos?.length) {
      for (const item of index.capitulos) {
        const requestedPath = normalizePath(item.arquivo);
        const entry = fileByPath.get(requestedPath) ?? markdownEntries.find((candidate) => baseName(candidate.path) === baseName(requestedPath));
        if (!entry) continue;
        usedPaths.add(entry.path);
        orderedChapters.push(await buildChapter(entry, orderedChapters.length, item));
      }
    }

    const collator = new Intl.Collator("pt-BR", { numeric: true, sensitivity: "base" });
    const remaining = markdownEntries.filter((entry) => !usedPaths.has(entry.path)).sort((a, b) => collator.compare(a.path, b.path));
    for (const entry of remaining) orderedChapters.push(await buildChapter(entry, orderedChapters.length));

    if (!orderedChapters.length) throw new Error("Os capítulos listados no index.json não foram encontrados.");

    releaseAssetUrls();
    const projectAssets = normalizedEntries.filter((entry) => !isMarkdown(entry.path) && baseName(entry.path).toLowerCase() !== "index.json");
    const nextAssetUrls: Record<string, string> = {};
    projectAssets.filter((entry) => isImage(entry.path)).forEach((entry) => {
      const url = URL.createObjectURL(entry.file);
      createdUrlsRef.current.push(url);
      nextAssetUrls[entry.path] = url;
    });

    setMetadata({
      title: index?.titulo?.trim() || "Livro sem título",
      author: index?.autor?.trim() || "Autor não informado",
      description: index?.descricao?.trim() || "Projeto importado para revisão e montagem.",
    });
    setChapters(orderedChapters);
    setAssets(projectAssets.map(({ path, file }) => ({ path, file })));
    setAssetUrls(nextAssetUrls);
    setActiveId(orderedChapters[0].id);
    setOpenActs(Object.fromEntries(groupChapters(orderedChapters).map((group) => [group.act, true])));
    setHasProject(true);
    setTab("editar");
    toast.success(`${orderedChapters.length} arquivos de texto foram organizados no manuscrito.`);
  };

  const importZip = async (file: File) => {
    setLoadingImport(true);
    try {
      const zip = await JSZip.loadAsync(file);
      const zipEntries = Object.values(zip.files).filter((entry) => !entry.dir);
      const entries = await Promise.all(
        zipEntries.map(async (entry) => {
          const blob = await entry.async("blob");
          return {
            path: entry.name,
            file: new File([blob], baseName(entry.name), { type: blob.type || mimeFromPath(entry.name) }),
          };
        }),
      );
      await hydrateProject(entries);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir esse arquivo ZIP.");
    } finally {
      setLoadingImport(false);
    }
  };

  const handleZipInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) await importZip(file);
    event.target.value = "";
  };

  const handleFolderInput = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;
    setLoadingImport(true);
    try {
      await hydrateProject(files.map((file) => ({ path: file.webkitRelativePath || file.name, file })));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível abrir a pasta.");
    } finally {
      setLoadingImport(false);
      event.target.value = "";
    }
  };

  const handleDrop = async (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropTarget(false);
    const file = Array.from(event.dataTransfer.files).at(0);
    if (!file) return;
    if (file.name.toLowerCase().endsWith(".zip")) await importZip(file);
    else toast.error("Arraste um arquivo .zip. Para escolher uma pasta, use o botão “Escolher pasta”.");
  };

  const createNewBook = () => {
    releaseAssetUrls();
    const firstChapter: Chapter = {
      id: `capitulo-inicial-${Date.now()}`,
      path: "capitulo-01.md",
      title: "Capítulo 1",
      act: "Manuscrito",
      content: "",
      included: true,
    };
    setMetadata({ title: "Novo livro", author: "", description: "" });
    setChapters([firstChapter]);
    setAssets([]);
    setAssetUrls({});
    setActiveId(firstChapter.id);
    setOpenActs({ Manuscrito: true });
    setHasProject(true);
    setTab("editar");
    toast.success("Livro vazio criado. Dê um título e comece a escrever.");
  };

  const addVisualAssets = (files: File[], purpose: "cover" | "inline") => {
    const images = files.filter((file) => isImage(file.name));
    if (!images.length) {
      toast.error("Escolha ao menos uma imagem em PNG, JPG, WebP, SVG ou GIF.");
      return;
    }

    const selected = purpose === "cover" ? images.slice(0, 1) : images;
    const existingPaths = new Set(assets.map((asset) => asset.path));
    const newAssets = selected.map((file, index) => {
      const extension = file.name.split(".").at(-1)?.toLowerCase() || "png";
      const originalStem = file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "") || `imagem-${index + 1}`;
      let path = purpose === "cover" ? `assets/capa.${extension}` : `assets/${originalStem}.${extension}`;
      let duplicate = 2;
      while (purpose !== "cover" && existingPaths.has(path)) {
        path = `assets/${originalStem}-${duplicate}.${extension}`;
        duplicate += 1;
      }
      existingPaths.add(path);
      return { path, file: new File([file], baseName(path), { type: file.type || mimeFromPath(path) }) };
    });

    const nextUrls: Record<string, string> = {};
    newAssets.forEach((asset) => {
      const url = URL.createObjectURL(asset.file);
      createdUrlsRef.current.push(url);
      nextUrls[asset.path] = url;
    });
    if (purpose === "cover") {
      setAssets((current) => [...current.filter((asset) => !isCoverPath(asset.path)), ...newAssets]);
      setAssetUrls((current) => {
        const next = { ...current };
        Object.entries(next).filter(([path]) => isCoverPath(path)).forEach(([path, url]) => {
          URL.revokeObjectURL(url);
          delete next[path];
        });
        return { ...next, ...nextUrls };
      });
      toast.success("Capa definida para a montagem, impressão e ePub.");
      return;
    }

    setAssets((current) => [...current, ...newAssets]);
    setAssetUrls((current) => ({ ...current, ...nextUrls }));
    if (activeChapter) {
      const imageMarkdown = newAssets.map((asset) => `![${baseName(asset.path).replace(/\.[^.]+$/, "")}](${asset.path})`).join("\n\n");
      updateChapter(activeChapter.id, { content: `${activeChapter.content.trimEnd()}${activeChapter.content.trim() ? "\n\n" : ""}${imageMarkdown}\n` });
    }
    toast.success(`${newAssets.length} imagem(ns) inserida(s) no capítulo atual.`);
  };

  const handleCoverInput = (event: ChangeEvent<HTMLInputElement>) => {
    addVisualAssets(Array.from(event.target.files ?? []), "cover");
    event.target.value = "";
  };

  const handleInlineImages = (event: ChangeEvent<HTMLInputElement>) => {
    addVisualAssets(Array.from(event.target.files ?? []), "inline");
    event.target.value = "";
  };

  const moveChapter = (dragId: string, targetId: string) => {
    if (dragId === targetId) return;
    setChapters((current) => {
      const from = current.findIndex((chapter) => chapter.id === dragId);
      const to = current.findIndex((chapter) => chapter.id === targetId);
      if (from < 0 || to < 0) return current;
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const addChapter = () => {
    const position = chapters.length + 1;
    const chapter: Chapter = {
      id: `novo-${Date.now()}`,
      path: `capitulo-${String(position).padStart(2, "0")}.md`,
      title: `Capítulo ${position}`,
      act: activeChapter?.act || "Manuscrito",
      content: "# Novo capítulo\n\nComece a escrever aqui.",
      included: true,
    };
    setChapters((current) => [...current, chapter]);
    setActiveId(chapter.id);
    setOpenActs((current) => ({ ...current, [chapter.act]: true }));
    toast.success("Novo capítulo criado.");
  };

  const removeChapter = (id: string) => {
    const chapter = chapters.find((item) => item.id === id);
    if (!chapter) return;
    setChapters((current) => current.filter((item) => item.id !== id));
    if (id === activeId) setActiveId(chapters.find((item) => item.id !== id)?.id ?? "");
    toast.message(`“${chapter.title}” foi removido da sessão.`);
  };

  const downloadChapter = (chapter: Chapter) => {
    downloadBlob(new Blob([chapter.content], { type: "text/markdown;charset=utf-8" }), baseName(chapter.path));
    toast.success("Arquivo Markdown preparado para download.");
  };

  const downloadProject = async () => {
    const zip = new JSZip();
    zip.file(
      "index.json",
      JSON.stringify(
        {
          titulo: metadata.title,
          autor: metadata.author,
          descricao: metadata.description,
          capitulos: chapters.map((chapter) => ({ arquivo: chapter.path, titulo: chapter.title, ato: chapter.act, incluido: chapter.included })),
        },
        null,
        2,
      ),
    );
    chapters.forEach((chapter) => zip.file(chapter.path, chapter.content));
    assets.forEach((asset) => zip.file(asset.path, asset.file));
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob(blob, `${metadata.title.trim().replace(/\s+/g, "-").toLowerCase() || "livro"}-atualizado.zip`);
    toast.success("Projeto completo exportado como ZIP.");
  };

  const chaptersForOutput = useMemo(() => {
    const included = chapters.filter((chapter) => chapter.included);
    if (settings.scope === "capitulo") return activeChapter && activeChapter.included ? [activeChapter] : [];
    if (settings.scope === "ato") return activeChapter ? included.filter((chapter) => chapter.act === activeChapter.act) : [];
    return included;
  }, [activeChapter, chapters, settings.scope]);

  const outputGroups = useMemo(() => groupChapters(chaptersForOutput), [chaptersForOutput]);
  const printTitle = settings.scope === "livro" ? metadata.title : settings.scope === "ato" ? activeChapter?.act || metadata.title : activeChapter?.title || metadata.title;

  const downloadEpub = async () => {
    if (!chaptersForOutput.length) {
      toast.error("Selecione pelo menos um capítulo incluído para exportar o ePub.");
      return;
    }

    setExportingEpub(true);
    try {
      const zip = new JSZip();
      const identifier = crypto.randomUUID?.() ?? `caderno-${Date.now()}`;
      const chaptersForEpub = chaptersForOutput.map((chapter, index) => ({ chapter, id: `chapter-${index + 1}`, href: `text/chapter-${String(index + 1).padStart(3, "0")}.xhtml` }));
      const chapterById = new Map(chaptersForEpub.map((entry) => [entry.chapter.id, entry]));
      const imageAssets = assets.filter((asset) => isImage(asset.path));
      const imageHrefs: Record<string, string> = {};
      const imageEntries = imageAssets.map((asset, index) => {
        const normalizedPath = epubSafePath(asset.path);
        const filename = epubSafePath(normalizedPath.replace(/^assets\//i, "")) || `imagem-${index + 1}`;
        const href = `images/${filename}`;
        imageHrefs[normalizedPath] = `../${href}`;
        imageHrefs[`assets/${normalizedPath.replace(/^assets\//i, "")}`] = `../${href}`;
        return { asset, id: `image-${index + 1}`, href, mediaType: mimeFromPath(normalizedPath), normalizedPath };
      });
      const coverImage = imageEntries.find((entry) => /(^|\/)(capa|cover)(\.|[-_])/i.test(entry.normalizedPath));
      const groupsForEpub = groupChapters(chaptersForOutput);
      const safeTitle = metadata.title.trim() || "Livro sem título";
      const safeAuthor = metadata.author.trim() || "Autor não informado";
      const titlePage = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="pt-BR" lang="pt-BR">
  <head><title>${xmlEscape(safeTitle)}</title><link rel="stylesheet" type="text/css" href="../styles/book.css" /></head>
  <body class="title-page">${coverImage ? `<img class="cover-image" src="../${coverImage.href}" alt="Capa de ${xmlEscape(safeTitle)}" />` : ""}<section><p class="eyebrow">EDIÇÃO DIGITAL</p><h1>${xmlEscape(safeTitle)}</h1><p class="author">${xmlEscape(safeAuthor)}</p>${metadata.description.trim() ? `<p class="description">${xmlEscape(metadata.description.trim())}</p>` : ""}</section></body>
</html>`;
      const navigation = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="pt-BR" lang="pt-BR">
  <head><title>Sumário</title><link rel="stylesheet" type="text/css" href="styles/book.css" /></head>
  <body><nav epub:type="toc" id="toc"><h1>Sumário</h1><ol>${settings.includeCover ? `<li><a href="text/title.xhtml">${xmlEscape(safeTitle)}</a></li>` : ""}${groupsForEpub.map((group) => `<li><span>${xmlEscape(group.act)}</span><ol>${group.chapters.map((chapter) => { const entry = chapterById.get(chapter.id); return entry ? `<li><a href="${entry.href}">${xmlEscape(chapter.title)}</a></li>` : ""; }).join("")}</ol></li>`).join("")}</ol></nav></body>
</html>`;
      const styleSheet = `@charset "utf-8";
body { margin: 5%; color: #20201d; font-family: Georgia, serif; font-size: 1em; line-height: 1.6; }
h1, h2 { color: #292622; font-family: Georgia, serif; line-height: 1.15; }
h1 { margin: 0 0 1.2em; font-size: 1.8em; } h2 { margin-top: 1.8em; }
p { margin: 0 0 1em; } blockquote { margin: 1.5em 1em; padding-left: 1em; border-left: 3px solid #a74035; color: #5c5249; }
img { max-width: 100%; height: auto; } .title-page { text-align: center; } .title-page section { margin-top: 15%; } .cover-image { display: block; max-height: 68vh; margin: 0 auto 2em; } .eyebrow { color: #a74035; font-family: sans-serif; font-size: .7em; font-weight: bold; letter-spacing: .16em; } .author { font-size: 1.1em; } .description { max-width: 28em; margin: 2em auto; color: #665d54; } nav ol { padding-left: 1.2em; } nav li { margin: .45em 0; } a { color: inherit; text-decoration: none; }`;

      zip.file("mimetype", "application/epub+zip", { compression: "STORE" });
      zip.file("META-INF/container.xml", `<?xml version="1.0" encoding="utf-8"?>\n<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container"><rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml" /></rootfiles></container>`);
      zip.file("OEBPS/styles/book.css", styleSheet);
      zip.file("OEBPS/nav.xhtml", navigation);
      if (settings.includeCover) zip.file("OEBPS/text/title.xhtml", titlePage);
      chaptersForEpub.forEach(({ chapter, href }) => zip.file(`OEBPS/${href}`, epubChapterMarkup(chapter, imageHrefs)));
      imageEntries.forEach(({ asset, href }) => zip.file(`OEBPS/${href}`, asset.file));

      const manifest = [
        '<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav" />',
        '<item id="book-css" href="styles/book.css" media-type="text/css" />',
        ...(settings.includeCover ? ['<item id="title-page" href="text/title.xhtml" media-type="application/xhtml+xml" />'] : []),
        ...chaptersForEpub.map(({ id, href }) => `<item id="${id}" href="${href}" media-type="application/xhtml+xml" />`),
        ...imageEntries.map(({ id, href, mediaType }) => `<item id="${id}" href="${href}" media-type="${mediaType}"${id === coverImage?.id ? ' properties="cover-image"' : ""} />`),
      ].join("\n    ");
      const spine = [
        ...(settings.includeCover ? ['<itemref idref="title-page" />'] : []),
        ...chaptersForEpub.map(({ id }) => `<itemref idref="${id}" />`),
      ].join("\n    ");
      zip.file("OEBPS/content.opf", `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="pt-BR">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:identifier id="book-id">urn:uuid:${identifier}</dc:identifier><dc:title>${xmlEscape(safeTitle)}</dc:title><dc:creator>${xmlEscape(safeAuthor)}</dc:creator><dc:language>pt-BR</dc:language>${metadata.description.trim() ? `<dc:description>${xmlEscape(metadata.description.trim())}</dc:description>` : ""}<meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d{3}Z$/, "Z")}</meta></metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine>
    ${spine}
  </spine>
</package>`);

      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", mimeType: "application/epub+zip" });
      downloadBlob(blob, `${epubFilename(printTitle)}.epub`);
      toast.success("ePub preparado com capítulos, metadados e imagens locais.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível gerar o ePub.");
    } finally {
      setExportingEpub(false);
    }
  };

  const printBook = () => {
    if (!chaptersForOutput.length) {
      toast.error("Selecione pelo menos um capítulo incluído para imprimir.");
      return;
    }
    document.body.classList.add("printing-book");
    window.print();
  };

  useEffect(() => {
    const finishPrint = () => document.body.classList.remove("printing-book");
    window.addEventListener("afterprint", finishPrint);
    return () => {
      window.removeEventListener("afterprint", finishPrint);
      document.body.classList.remove("printing-book");
    };
  }, []);

  useEffect(() => {
    const capturePrintShortcut = (event: KeyboardEvent) => {
      if (!hasProject || !(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "p") return;
      event.preventDefault();
      printBook();
    };
    window.addEventListener("keydown", capturePrintShortcut);
    return () => window.removeEventListener("keydown", capturePrintShortcut);
  }, [hasProject, chaptersForOutput]);

  if (!hasProject) {
    return (
      <div className="start-shell">
        <header className="start-header">
          <div className="brand-lockup start-brand"><img src={BRAND_LOGO} alt="Símbolo Caderno" className="brand-symbol" /><div><span className="eyebrow">ATELIÊ DE LIVROS</span><strong>Caderno</strong></div></div>
          <span className="start-status">PRONTO PARA UM MANUSCRITO</span>
        </header>
        <main className="start-main">
          <section className="start-intro">
            <span className="eyebrow">NOVA COMPOSIÇÃO</span>
            <h1>Comece pelo<br /><em>manuscrito.</em></h1>
            <p>Crie um livro vazio ou abra um projeto real em Markdown. Nada de conteúdo fictício: você trabalha apenas com o que decidir escrever ou enviar.</p>
            <div className="start-actions">
              <Button className="new-book-cta" onClick={createNewBook}><Plus size={18} /> Novo livro</Button>
              <Button variant="outline" className="upload-book-cta" disabled={loadingImport} onClick={() => zipInputRef.current?.click()}><FileArchive size={17} /> Subir arquivo .zip</Button>
            </div>
            <button className="folder-text-action" disabled={loadingImport} onClick={() => folderInputRef.current?.click()}><FolderOpen size={15} /> ou selecionar uma pasta</button>
          </section>
          <section
            className={`start-dropzone ${isDropTarget ? "is-drop-target" : ""}`}
            onDrop={handleDrop}
            onDragOver={(event) => { event.preventDefault(); setIsDropTarget(true); }}
            onDragLeave={() => setIsDropTarget(false)}
          >
            <div className="drop-folio">01</div>
            <div className="start-drop-icon">{loadingImport ? <LoaderCircle className="spin" size={24} /> : <Upload size={24} />}</div>
            <strong>{loadingImport ? "Lendo o projeto..." : "Suba um livro para organizar"}</strong>
            <p>Arraste um ZIP com arquivos <code>.md</code>, <code>index.json</code> opcional e a pasta <code>assets/</code>.</p>
            <div className="drop-rule" />
            <small>Os arquivos permanecem nesta sessão do navegador.</small>
          </section>
          <input ref={zipInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={handleZipInput} />
          <input ref={folderInputRef} type="file" multiple className="hidden" onChange={handleFolderInput} />
        </main>
      </div>
    );
  }

  return (
    <div
      className="app-shell"
      style={{
        "--paper-texture": `url(${PAPER_TEXTURE})`,
        "--page-width": `${dimensions.width}mm`,
        "--page-height": `${dimensions.height}mm`,
        "--print-top": `${settings.marginTop}mm`,
        "--print-bottom": `${settings.marginBottom}mm`,
        "--print-side": `${settings.marginSide}mm`,
        "--book-font": settings.bodyFont,
        "--display-font": settings.titleFont,
        "--book-font-size": `${settings.fontSize}pt`,
        "--book-line-height": settings.lineHeight,
        "--book-indent": `${settings.paragraphIndent}mm`,
        "--book-color": settings.bodyColor,
        "--book-paper": settings.paperColor,
        "--book-accent": settings.accentColor,
        "--drop-cap-font": settings.dropCapFont,
        "--drop-cap-color": settings.dropCapColor,
        "--drop-cap-lines": settings.dropCapLines,
      } as React.CSSProperties}
    >
      <style media="print">{`@page { size: ${dimensions.width}mm ${dimensions.height}mm; margin: 0; }`}</style>
      <aside className="book-spine no-print">
        <div className="brand-lockup">
          <img src={BRAND_LOGO} alt="Símbolo Caderno" className="brand-symbol" />
          <div>
            <span className="eyebrow eyebrow-light">ATELIÊ DE LIVROS</span>
            <strong>Caderno</strong>
          </div>
        </div>

        <div className="project-badge">
          <div className="project-icon"><BookMarked size={17} /></div>
          <div className="min-w-0">
            <p>{metadata.title}</p>
            <span>{chapters.filter((chapter) => chapter.included).length} capítulos na montagem</span>
          </div>
          <MoreHorizontal size={16} aria-hidden="true" />
        </div>

        <div className="spine-section-label"><span>ESTRUTURA DO LIVRO</span><span>{chapters.length}</span></div>
        <nav className="chapter-tree" aria-label="Estrutura do livro">
          {groups.map((group) => {
            const isOpen = openActs[group.act] ?? true;
            return (
              <div className="act-group" key={group.act}>
                <button className="act-toggle" onClick={() => setOpenActs((current) => ({ ...current, [group.act]: !isOpen }))}>
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <span>{group.act}</span>
                  <em>{group.chapters.length}</em>
                </button>
                {isOpen && (
                  <div className="act-children">
                    {group.chapters.map((chapter) => (
                      <div
                        key={chapter.id}
                        draggable
                        onDragStart={() => setDraggedId(chapter.id)}
                        onDragEnd={() => setDraggedId(null)}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => {
                          if (draggedId) moveChapter(draggedId, chapter.id);
                          setDraggedId(null);
                        }}
                        className={`chapter-row ${activeId === chapter.id ? "is-active" : ""} ${draggedId === chapter.id ? "is-dragging" : ""}`}
                      >
                        <GripVertical className="drag-handle" size={14} aria-hidden="true" />
                        <Checkbox
                          aria-label={`Incluir ${chapter.title} na montagem`}
                          checked={chapter.included}
                          onCheckedChange={(checked) => updateChapter(chapter.id, { included: checked === true })}
                          onClick={(event) => event.stopPropagation()}
                        />
                        <button className="chapter-select" onClick={() => { setActiveId(chapter.id); setTab("editar"); }}>
                          <span>{chapter.title}</span>
                          <small>{baseName(chapter.path)}</small>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <Button variant="ghost" className="add-chapter-button" onClick={addChapter}><Plus size={16} /> Novo capítulo</Button>
        <div className="spine-footer">
          <div><Check size={15} /><span>Rascunho local protegido</span></div>
          <small>{lastLocalSave ? `Salvo às ${new Date(lastLocalSave).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Preparando salvamento automático"}</small>
        </div>
      </aside>

      <main className="workspace no-print">
        <header className="topbar">
          <div className="mobile-brand"><img src={BRAND_LOGO} alt="" /><strong>Caderno</strong></div>
          <div className="workshop-seal" aria-label="Selo da oficina editorial">
            <img src={BRAND_LOGO} alt="" />
            <span>OFICINA<br /><b>01</b></span>
          </div>
          <div className="view-tabs" role="tablist" aria-label="Áreas de trabalho">
            <button className={tab === "editar" ? "selected" : ""} onClick={() => setTab("editar")}><PenLine size={16} /> Editar</button>
            <button className={tab === "montar" ? "selected" : ""} onClick={() => setTab("montar")}><LayoutTemplate size={16} /> Montagem</button>
            <button className={tab === "configurar" ? "selected" : ""} onClick={() => setTab("configurar")}><Settings2 size={16} /> Impressão</button>
          </div>
          <div className="topbar-actions">
            <Tooltip>
              <TooltipTrigger asChild><Button variant="ghost" size="icon" className="icon-action" onClick={downloadProject} aria-label="Baixar projeto ZIP"><Archive size={17} /></Button></TooltipTrigger>
              <TooltipContent>Baixar projeto atualizado (.zip)</TooltipContent>
            </Tooltip>
            <Button variant="outline" className="epub-button" onClick={downloadEpub} disabled={exportingEpub}><BookOpen size={16} /> {exportingEpub ? "Gerando..." : "ePub"}</Button>
            <Button className="print-button" onClick={printBook}><Printer size={16} /> Preparar prova</Button>
          </div>
        </header>

        {tab === "editar" && (
          <section className="edit-area">
            <div className="editor-toolbar">
              <div className="folio-tag"><img src={BRAND_LOGO} alt="" /> <span>FÓLIO<br /><b>{String(chapters.findIndex((chapter) => chapter.id === activeChapter?.id) + 1).padStart(2, "0")}</b></span></div>
              <div className="title-fields">
                <Input aria-label="Título do capítulo" value={activeChapter?.title ?? ""} onChange={(event) => activeChapter && updateChapter(activeChapter.id, { title: event.target.value })} placeholder="Título do capítulo" />
                <Input aria-label="Ato ou seção" value={activeChapter?.act ?? ""} onChange={(event) => activeChapter && updateChapter(activeChapter.id, { act: event.target.value })} placeholder="Ato ou seção" />
              </div>
              {activeChapter && (
                <div className="chapter-actions">
                  <span className="autosave"><Check size={14} /> salvo</span>
                  <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="icon-action" onClick={() => downloadChapter(activeChapter)} aria-label="Baixar capítulo"><FileDown size={17} /></Button></TooltipTrigger>
                    <TooltipContent>Baixar este Markdown</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="icon-action" onClick={() => imageInputRef.current?.click()} aria-label="Inserir imagens no capítulo"><ImageIcon size={17} /></Button></TooltipTrigger>
                    <TooltipContent>Inserir imagens no capítulo</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild><Button variant="ghost" size="icon" className="icon-action destructive-action" onClick={() => removeChapter(activeChapter.id)} aria-label="Remover capítulo"><X size={17} /></Button></TooltipTrigger>
                    <TooltipContent>Remover da sessão</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            <div className="writing-plane">
              <section className="markdown-editor-pane">
                <div className="pane-heading"><span><Type size={15} /> MARKDOWN</span><span>{activeChapter?.content.length ?? 0} caracteres</span></div>
                <Textarea
                  className="markdown-textarea"
                  value={activeChapter?.content ?? ""}
                  onChange={(event) => activeChapter && updateChapter(activeChapter.id, { content: event.target.value })}
                  placeholder="Escreva ou cole o texto do capítulo em Markdown."
                  spellCheck
                />
                <div className="format-hints"><span># Título</span><span>**negrito**</span><span>*itálico*</span><span>![imagem](assets/foto.jpg)</span></div>
              </section>
              <section className="live-preview-pane">
                <div className="pane-heading"><span><EyeIcon /> PRÉ-VISUALIZAÇÃO</span><span>renderização ao vivo</span></div>
                <article className="chapter-proof">
                  <div className="proof-running-head"><span>{metadata.title}</span><span>prova de leitura</span></div>
                  <h1>{activeChapter?.title || "Capítulo sem título"}</h1>
                  <div className="proof-rule" />
                  <div className={`markdown-body ${settings.dropCapEnabled ? "has-drop-cap" : ""}`} dangerouslySetInnerHTML={{ __html: renderedMarkdown(activeChapter?.content ?? "", assetUrls, activeChapter?.title, true) }} />
                </article>
              </section>
            </div>
          </section>
        )}

        {tab === "montar" && (
          <section className="assembly-area">
            <div className="assembly-header">
              <div>
                <span className="eyebrow">PROVA DE COMPOSIÇÃO</span>
                <h1>O livro em sequência</h1>
                <p>{chaptersForOutput.length} capítulos incluídos · {dimensions.label} · {settings.bodyFont}</p>
              </div>
              <div className="assembly-summary"><ListTree size={18} /><strong>{outputGroups.length}</strong><span>seções</span></div>
            </div>
            <BookPages
              metadata={metadata}
              groups={outputGroups}
              settings={settings}
              assetUrls={assetUrls}
              coverUrl={coverUrl}
              className="screen-book-pages"
            />
          </section>
        )}

        {tab === "configurar" && (
          <section className="settings-area">
            <div className="settings-intro">
              <span className="eyebrow">CONFIGURAÇÃO DE SAÍDA</span>
              <h1>Prepare a página para a imprensa.</h1>
              <p>Essas definições controlam o preview e a janela de impressão do navegador. O texto permanece selecionável ao salvar como PDF.</p>
            </div>
            <div className="settings-grid">
              <section className="settings-card">
                <h2><LayoutTemplate size={17} /> Página e margens</h2>
                <div className="field-grid two-col">
                  <Field label="Formato"><Select value={settings.pageFormat} onValueChange={(value: PageFormat) => setSettings((current) => ({ ...current, pageFormat: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="A5">A5 · romance</SelectItem><SelectItem value="A4">A4 · prova</SelectItem><SelectItem value="Carta">Carta · 216 × 279 mm</SelectItem><SelectItem value="Custom">Tamanho customizado</SelectItem></SelectContent></Select></Field>
                  <Field label="Escopo de exportação"><Select value={settings.scope} onValueChange={(value: ExportScope) => setSettings((current) => ({ ...current, scope: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="livro">Livro completo</SelectItem><SelectItem value="ato">Ato atual</SelectItem><SelectItem value="capitulo">Capítulo atual</SelectItem></SelectContent></Select></Field>
                  <Field label="Posição da numeração"><Select value={settings.pageNumberPosition} onValueChange={(value: PageNumberPosition) => setSettings((current) => ({ ...current, pageNumberPosition: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="footer-center">Rodapé central</SelectItem><SelectItem value="footer-left">Rodapé esquerdo</SelectItem><SelectItem value="footer-right">Rodapé direito</SelectItem><SelectItem value="header-left">Cabeçalho esquerdo</SelectItem><SelectItem value="header-center">Cabeçalho central</SelectItem><SelectItem value="header-right">Cabeçalho direito</SelectItem></SelectContent></Select></Field>
                </div>
                {settings.pageFormat === "Custom" && <div className="field-grid two-col"><Field label="Largura (mm)"><Input type="number" value={settings.customWidth} onChange={(event) => setSettings((current) => ({ ...current, customWidth: Number(event.target.value) || 1 }))} /></Field><Field label="Altura (mm)"><Input type="number" value={settings.customHeight} onChange={(event) => setSettings((current) => ({ ...current, customHeight: Number(event.target.value) || 1 }))} /></Field></div>}
                <div className="margin-grid">
                  <Field label="Superior (mm)"><Input type="number" value={settings.marginTop} onChange={(event) => setSettings((current) => ({ ...current, marginTop: Number(event.target.value) || 0 }))} /></Field>
                  <Field label="Inferior (mm)"><Input type="number" value={settings.marginBottom} onChange={(event) => setSettings((current) => ({ ...current, marginBottom: Number(event.target.value) || 0 }))} /></Field>
                  <Field label="Laterais (mm)"><Input type="number" value={settings.marginSide} onChange={(event) => setSettings((current) => ({ ...current, marginSide: Number(event.target.value) || 0 }))} /></Field>
                </div>
              </section>

              <section className="settings-card">
                <h2><Type size={17} /> Corpo e ritmo</h2>
                <div className="field-grid two-col">
                  <Field label="Fonte do corpo"><Select value={settings.bodyFont} onValueChange={(value: PrintSettings["bodyFont"]) => setSettings((current) => ({ ...current, bodyFont: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Source Serif 4">Source Serif 4</SelectItem><SelectItem value="Georgia">Georgia</SelectItem><SelectItem value="Merriweather">Merriweather</SelectItem></SelectContent></Select></Field>
                  <Field label="Fonte dos títulos"><Select value={settings.titleFont} onValueChange={(value: PrintSettings["titleFont"]) => setSettings((current) => ({ ...current, titleFont: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Playfair Display">Playfair Display</SelectItem><SelectItem value="Cormorant Garamond">Cormorant Garamond</SelectItem><SelectItem value="Georgia">Georgia</SelectItem></SelectContent></Select></Field>
                </div>
                <RangeField label="Tamanho do corpo" value={settings.fontSize} min={9} max={15} step={0.5} suffix=" pt" onChange={(fontSize) => setSettings((current) => ({ ...current, fontSize }))} />
                <RangeField label="Entrelinha" value={settings.lineHeight} min={1.2} max={2} step={0.05} suffix="" onChange={(lineHeight) => setSettings((current) => ({ ...current, lineHeight }))} />
                <RangeField label="Recuo de parágrafo" value={settings.paragraphIndent} min={0} max={12} step={1} suffix=" mm" onChange={(paragraphIndent) => setSettings((current) => ({ ...current, paragraphIndent }))} />
                <div className="color-fields"><ColorField label="Cor do texto" value={settings.bodyColor} onChange={(bodyColor) => setSettings((current) => ({ ...current, bodyColor }))} /><ColorField label="Cor do papel" value={settings.paperColor} onChange={(paperColor) => setSettings((current) => ({ ...current, paperColor }))} /><ColorField label="Tinta de destaque" value={settings.accentColor} onChange={(accentColor) => setSettings((current) => ({ ...current, accentColor }))} /></div>
              </section>

              <section className="settings-card settings-card-wide">
                <h2><BookOpen size={17} /> Elementos da montagem</h2>
                <div className="switch-grid">
                  <SwitchField label="Folha de rosto" description="Título, autor e capa disponível" checked={settings.includeCover} onCheckedChange={(includeCover) => setSettings((current) => ({ ...current, includeCover }))} />
                  <SwitchField label="Sumário" description="Gerado a partir dos capítulos incluídos" checked={settings.includeToc} onCheckedChange={(includeToc) => setSettings((current) => ({ ...current, includeToc }))} />
                  <SwitchField label="Aberturas de ato" description="Uma página dedicada a cada nova seção" checked={settings.includeActs} onCheckedChange={(includeActs) => setSettings((current) => ({ ...current, includeActs }))} />
                  <SwitchField label="Numeração de página" description="Rodapé composto no preview e impressão" checked={settings.includeNumbers} onCheckedChange={(includeNumbers) => setSettings((current) => ({ ...current, includeNumbers }))} />
                  <SwitchField label="Cabeçalho corrido" description="Título do livro no alto das páginas" checked={settings.includeHeader} onCheckedChange={(includeHeader) => setSettings((current) => ({ ...current, includeHeader }))} />
                </div>
                <div className="drop-cap-controls"><SwitchField label="Capitular" description="Aplica uma letra inicial decorativa ao primeiro parágrafo do capítulo" checked={settings.dropCapEnabled} onCheckedChange={(dropCapEnabled) => setSettings((current) => ({ ...current, dropCapEnabled }))} />{settings.dropCapEnabled && <div className="field-grid three-col"><Field label="Fonte da capitular"><Select value={settings.dropCapFont} onValueChange={(value: PrintSettings["dropCapFont"]) => setSettings((current) => ({ ...current, dropCapFont: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Playfair Display">Playfair Display</SelectItem><SelectItem value="Cormorant Garamond">Cormorant Garamond</SelectItem><SelectItem value="Georgia">Georgia</SelectItem></SelectContent></Select></Field><ColorField label="Cor da capitular" value={settings.dropCapColor} onChange={(dropCapColor) => setSettings((current) => ({ ...current, dropCapColor }))} /><RangeField label="Altura" value={settings.dropCapLines} min={2} max={5} step={1} suffix=" linhas" onChange={(dropCapLines) => setSettings((current) => ({ ...current, dropCapLines }))} /></div>}</div>
                <div className="settings-cta"><div><strong>Saída do livro.</strong><span>Gere uma prova PDF ou um ePub refluível para leitores digitais.</span></div><div className="settings-cta-actions"><Button variant="outline" onClick={downloadEpub} disabled={exportingEpub}><BookOpen size={16} /> {exportingEpub ? "Gerando ePub..." : "Exportar ePub"}</Button><Button onClick={printBook}><Printer size={16} /> Gerar prova em PDF</Button></div></div>
              </section>
            </div>
          </section>
        )}
      </main>

      <aside className="import-rail no-print">
        <div className="rail-head"><span className="eyebrow">PROJETO</span><span className="status-dot" title="Tudo salvo em memória" /></div>
        <section className="metadata-card dossier-card">
          <div className="dossier-tab"><span>DOSSIÊ · 01</span><img src={BRAND_LOGO} alt="" /></div>
          <div className="metadata-card-title"><BookOpen size={17} /><span>Ficha editorial</span><em>REGISTRO</em></div>
          <label>Título<Input value={metadata.title} onChange={(event) => setMetadata((current) => ({ ...current, title: event.target.value }))} /></label>
          <label>Autor<Input value={metadata.author} onChange={(event) => setMetadata((current) => ({ ...current, author: event.target.value }))} /></label>
          <label>Sinopse<Textarea value={metadata.description} onChange={(event) => setMetadata((current) => ({ ...current, description: event.target.value }))} /></label>
          <div className="cover-upload"><div><span>Capa do livro</span><small>{assets.some((asset) => isCoverPath(asset.path)) ? "imagem definida" : "nenhuma capa enviada"}</small></div><Button type="button" variant="outline" size="sm" onClick={() => coverInputRef.current?.click()}><ImageIcon size={14} /> {assets.some((asset) => isCoverPath(asset.path)) ? "Trocar capa" : "Enviar capa"}</Button></div>
        </section>

        <section
          className={`import-zone ${isDropTarget ? "is-drop-target" : ""}`}
          onDrop={handleDrop}
          onDragOver={(event) => { event.preventDefault(); setIsDropTarget(true); }}
          onDragLeave={() => setIsDropTarget(false)}
        >
          <div className="import-ledger"><span>ENTRADA DE ARQUIVOS</span><i>□</i></div>
          <div className="import-icon">{loadingImport ? <LoaderCircle className="spin" size={21} /> : <FileArchive size={21} />}</div>
          <strong>{loadingImport ? "Lendo o manuscrito..." : "Receber manuscrito"}</strong>
          <p>ZIP com `.md`, `index.json` e `assets/`.</p>
          <div className="import-buttons">
            <Button size="sm" variant="outline" disabled={loadingImport} onClick={() => zipInputRef.current?.click()}><Upload size={14} /> Enviar ZIP</Button>
            <Button size="sm" variant="ghost" disabled={loadingImport} onClick={() => folderInputRef.current?.click()}><FolderOpen size={14} /> Pasta</Button>
          </div>
          <input ref={zipInputRef} type="file" accept=".zip,application/zip" className="hidden" onChange={handleZipInput} />
          <input ref={folderInputRef} type="file" multiple className="hidden" onChange={handleFolderInput} />
          <input ref={coverInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" className="hidden" onChange={handleCoverInput} />
          <input ref={imageInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif" multiple className="hidden" onChange={handleInlineImages} />
        </section>

        <section className="project-stats"><div className="inventory-label"><span>INVENTÁRIO DA OFICINA</span><i>✣</i></div>
          <div><FileText size={16} /><span><strong>{chapters.length}</strong> arquivos Markdown</span></div>
          <div><ImageIcon size={16} /><span><strong>{Object.keys(assetUrls).length}</strong> imagens locais</span></div>
          <div><PanelLeft size={16} /><span><strong>{groups.length}</strong> atos / seções</span></div>
        </section>
        <div className="rail-note"><span>Local e privado</span><p>Texto, estrutura e configurações são salvos automaticamente neste navegador.{restoredImageCount > 0 && " Reenvie as imagens do rascunho restaurado antes de exportar."}</p></div>
      </aside>

      <div className="print-root">
        <BookPages metadata={{ ...metadata, title: printTitle }} groups={outputGroups} settings={settings} assetUrls={assetUrls} coverUrl={coverUrl} className="print-book-pages" />
      </div>
    </div>
  );
}

function EyeIcon() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M2.06 12.35a1 1 0 0 1 0-.7C3.35 7.6 7.34 5 12 5c4.66 0 8.65 2.6 9.94 6.65a1 1 0 0 1 0 .7C20.65 16.4 16.66 19 12 19c-4.66 0-8.65-2.6-9.94-6.65Z" /><circle cx="12" cy="12" r="3" /></svg>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="form-field"><span>{label}</span>{children}</label>;
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <label className="color-field"><span>{label}</span><div><input type="color" value={value} onChange={(event) => onChange(event.target.value)} aria-label={label} /><code>{value.toUpperCase()}</code></div></label>;
}

function RangeField({ label, value, min, max, step, suffix, onChange }: { label: string; value: number; min: number; max: number; step: number; suffix: string; onChange: (value: number) => void }) {
  return <div className="range-field"><div><span>{label}</span><strong>{value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}{suffix}</strong></div><Slider min={min} max={max} step={step} value={[value]} onValueChange={([next]) => onChange(next)} /></div>;
}

function SwitchField({ label, description, checked, onCheckedChange }: { label: string; description: string; checked: boolean; onCheckedChange: (value: boolean) => void }) {
  return <div className="switch-field"><div><strong>{label}</strong><span>{description}</span></div><Switch checked={checked} onCheckedChange={onCheckedChange} /></div>;
}

function BookPages({ metadata, groups, settings, assetUrls, coverUrl, className }: { metadata: BookMeta; groups: { act: string; chapters: Chapter[] }[]; settings: PrintSettings; assetUrls: Record<string, string>; coverUrl: string; className: string }) {
  const chapters = groups.flatMap((group) => group.chapters);
  let pageIndex = 1;
  return (
    <div className={`book-pages ${className}`}>
      {settings.includeCover && (
        <article className="book-page cover-page">
          <div className="cover-art" style={{ backgroundImage: `linear-gradient(180deg, rgba(22,22,20,.08), rgba(22,22,20,.45)), url(${coverUrl})` }} />
          <div className="cover-content"><div className="cover-kicker">EDIÇÃO DE TRABALHO</div><h1>{metadata.title}</h1><p>{metadata.author}</p><div className="cover-colophon"><img src={BRAND_LOGO} alt="" /> CADERNO</div></div>
        </article>
      )}
      {settings.includeToc && (
        <article className="book-page toc-page">
          <div className="print-running-head"><span>{metadata.title}</span><span>sumário</span></div>
          <div className="book-page-content"><span className="book-label">SUMÁRIO</span><h2>Mapa do livro</h2><div className="toc-list">{groups.map((group) => <div key={group.act} className="toc-group"><strong>{group.act}</strong>{group.chapters.map((chapter, index) => <div key={chapter.id}><span>{chapter.title}</span><i /><em>{index + 1}</em></div>)}</div>)}</div></div>
          {settings.includeNumbers && <div className={`page-number ${settings.pageNumberPosition}`}>{pageIndex++}</div>}
        </article>
      )}
      {groups.map((group) => (
        <div className="book-section" key={group.act}>
          {settings.includeActs && group.act !== "Sem seção" && (
            <article className="book-page act-opening">
              <div className="act-opening-content"><span className="book-label">NOVA SEÇÃO</span><div className="act-marker">{String(groups.indexOf(group) + 1).padStart(2, "0")}</div><h2>{group.act}</h2></div>
              {settings.includeNumbers && <div className={`page-number ${settings.pageNumberPosition}`}>{pageIndex++}</div>}
            </article>
          )}
          {group.chapters.map((chapter) => (
            <article className="book-page chapter-page" key={chapter.id}>
              {settings.includeHeader && <div className="print-running-head"><span>{metadata.title}</span><span>{group.act}</span></div>}
              <div className="book-page-content"><span className="book-label">{group.act}</span><h2>{chapter.title}</h2><div className="chapter-mark" /><div className={`book-markdown markdown-body ${settings.dropCapEnabled ? "has-drop-cap" : ""}`} dangerouslySetInnerHTML={{ __html: renderedMarkdown(chapter.content, assetUrls, chapter.title, true) }} /></div>
              {settings.includeNumbers && <div className={`page-number ${settings.pageNumberPosition}`}>{pageIndex++}</div>}
            </article>
          ))}
        </div>
      ))}
      {!chapters.length && <div className="empty-book"><BookOpen size={26} /><strong>Nenhum texto selecionado</strong><span>Marque ao menos um capítulo na espinha do livro para visualizar a montagem.</span></div>}
    </div>
  );
}
