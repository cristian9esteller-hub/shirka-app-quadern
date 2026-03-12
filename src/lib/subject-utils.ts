/**
 * SHIRKA PALETA DE COLORES DEFINITIVA (Vibrante y Cálida)
 */

export const SUBJECT_COLORS = [
    { bg: 'bg-red-600', text: 'text-white font-black', border: 'border-red-700', raw: 'red' },
    { bg: 'bg-blue-600', text: 'text-white font-black', border: 'border-blue-700', raw: 'blue' },
    { bg: 'bg-emerald-600', text: 'text-white font-black', border: 'border-emerald-700', raw: 'emerald' },
    { bg: 'bg-orange-500', text: 'text-white font-black', border: 'border-orange-600', raw: 'orange' },
    { bg: 'bg-purple-600', text: 'text-white font-black', border: 'border-purple-700', raw: 'purple' },
    { bg: 'bg-amber-500', text: 'text-white font-black', border: 'border-amber-600', raw: 'amber' },
    { bg: 'bg-pink-600', text: 'text-white font-black', border: 'border-pink-700', raw: 'pink' },
    { bg: 'bg-indigo-600', text: 'text-white font-black', border: 'border-indigo-700', raw: 'indigo' },
    { bg: 'bg-cyan-600', text: 'text-white font-black', border: 'border-cyan-700', raw: 'cyan' },
    { bg: 'bg-rose-600', text: 'text-white font-black', border: 'border-rose-700', raw: 'rose' },
    { bg: 'bg-lime-600', text: 'text-white font-black', border: 'border-lime-700', raw: 'lime' },
    { bg: 'bg-fuchsia-600', text: 'text-white font-black', border: 'border-fuchsia-700', raw: 'fuchsia' },
    { bg: 'bg-sky-500', text: 'text-white font-black', border: 'border-sky-600', raw: 'sky' },
    { bg: 'bg-violet-600', text: 'text-white font-black', border: 'border-violet-700', raw: 'violet' },
    { bg: 'bg-teal-600', text: 'text-white font-black', border: 'border-teal-700', raw: 'teal' },
];

export const getSubjectColor = (subject: string, preferredIndex?: number) => {
    if (!subject) return SUBJECT_COLORS[0];

    // Si se proporciona un índice (por orden de creación), lo usamos directamente
    if (typeof preferredIndex === 'number') {
        return SUBJECT_COLORS[preferredIndex % SUBJECT_COLORS.length];
    }

    // Fallback: Hash estable para que la misma materia siempre tenga el mismo color
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
        hash = subject.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SUBJECT_COLORS.length;
    return SUBJECT_COLORS[index];
};

/**
 * Función de abreviaturas inteligentes para Shirka
 * Adaptada para ser ultra-corta en la Vista Global
 */
export const getShortName = (name: string, isUltraShort = false): string => {
    if (!name) return '';
    const n = name.toLowerCase();

    if (isUltraShort) {
        if (n.includes('matemàtiques')) return 'Mates';
        if (n.includes('medi natural') || n.includes('medi social')) return 'Medi';
        if (n.includes('educació física')) return 'E.F.';
        if (n.includes('artística')) return 'Art';
        if (n.includes('projectes')) return 'Proj.';
        if (n.includes('anglès')) return 'Anglès';
        if (n.includes('llengua catalana')) return 'Cat.';
        if (n.includes('llengua castellana')) return 'Cast.';
        if (n.includes('tutoria')) return 'Tut.';
        if (n.includes('reunió')) return 'Reun.';
    } else {
        if (n.includes('matemàtiques')) return 'Mates';
        if (n.includes('medi natural')) return 'M. Natural';
        if (n.includes('medi social')) return 'M. Social';
        if (n.includes('educació física')) return 'E. Física';
        if (n.includes('artística')) return 'Ed. Art';
        if (n.includes('projectes')) return 'Proj.';
        if (n.includes('reunió')) return 'Reun.';
        if (n.includes('tutoria')) return 'Tut.';
    }

    return name;
};
