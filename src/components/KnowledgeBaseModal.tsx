import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  X,
  ChevronRight,
  AlertTriangle,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { KNOWLEDGE_BASE, KnowledgeArticle } from '../data/knowledgeBase';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (promptText: string) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  onSelectPrompt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [activeArticle, setActiveArticle] = useState<KnowledgeArticle | null>(null);

  if (!isOpen) return null;

  const categories = [
    'Todas',
    'Windows y Sistema',
    'Equipos y Hardware',
    'Impresoras',
    'Conectividad',
    'Google Workspace',
  ];

  const filteredArticles = KNOWLEDGE_BASE.filter((art) => {
    const matchesCategory =
      selectedCategory === 'Todas' || art.category === selectedCategory;
    const matchesSearch =
      art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      art.steps.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl ring-1 ring-neutral-200 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-6 py-4 bg-neutral-50/70">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Guías de Soporte Técnico TRASA
              </h2>
              <p className="text-xs text-neutral-500">
                Soluciones para notebooks, Windows, impresoras y conectividad
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Category filter */}
        <div className="border-b border-neutral-200 p-4 bg-white space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por notebook lenta, pantalla azul, impresora, Wi-Fi, VPN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-neutral-50 pl-10 pr-4 py-2 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Article list */}
          <div className="space-y-3 md:border-r md:border-neutral-200 md:pr-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block">
              Guías Técnicas ({filteredArticles.length})
            </span>
            {filteredArticles.length === 0 ? (
              <div className="text-center py-10 text-xs text-neutral-500">
                No se encontraron guías con ese criterio.
              </div>
            ) : (
              filteredArticles.map((art) => {
                const isSelected = activeArticle?.id === art.id;
                return (
                  <div
                    key={art.id}
                    onClick={() => setActiveArticle(art)}
                    className={`p-3.5 rounded-xl border transition cursor-pointer text-left ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-1 ring-blue-600'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-neutral-900 leading-snug">
                        {art.title}
                      </span>
                      <ChevronRight className="h-4 w-4 text-neutral-400 shrink-0 mt-0.5" />
                    </div>
                    <p className="mt-1 text-[11px] text-neutral-500 line-clamp-2">
                      {art.summary}
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-[10px]">
                      <span className="px-2 py-0.5 rounded-md bg-neutral-100 font-semibold text-neutral-700">
                        {art.category}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Article detail viewer */}
          <div className="space-y-4">
            {activeArticle ? (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800">
                    {activeArticle.category}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] text-neutral-500">
                    <Mail className="h-3 w-3 text-blue-600" />
                    {activeArticle.escalationTarget}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-neutral-900 leading-snug">
                    {activeArticle.title}
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">{activeArticle.summary}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                    Pasos a seguir:
                  </h4>
                  <ol className="space-y-2 text-xs text-neutral-700">
                    {activeArticle.steps.map((step, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 bg-neutral-50 p-2.5 rounded-lg border border-neutral-200/80"
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">
                          {idx + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {activeArticle.warning && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>{activeArticle.warning}</span>
                  </div>
                )}

                <button
                  onClick={() => {
                    onSelectPrompt(activeArticle.suggestedPrompt);
                    onClose();
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition cursor-pointer"
                >
                  <span>Iniciar diagnóstico en el Chat</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-center p-6 text-xs text-neutral-400">
                Seleccioná una guía técnica para ver las instrucciones.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
