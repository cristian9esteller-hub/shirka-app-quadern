import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    Plus,
    Calendar,
    Trash2,
    FileText,
    Save,
    Loader2,
    Settings,
    MoreVertical,
    Check,
    ChevronRight,
    X,
    ExternalLink,
    StickyNote,
    Link as LinkIcon,
    Youtube,
    Presentation,
    TableProperties,
    Cloud
} from "lucide-react";
import { useData } from "@/contexts/DataContext";
import { toast } from "sonner";
import Icon from "../components/Icon";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Note, CalendarEvent } from "@/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const EVENT_COLORS = [
    { id: 'red', bg: 'bg-red-500', light: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-500', text: 'text-red-700 dark:text-red-300' },
    { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-700 dark:text-blue-300' },
    { id: 'green', bg: 'bg-green-500', light: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-500', text: 'text-green-700 dark:text-green-300' },
    { id: 'amber', bg: 'bg-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-700 dark:text-amber-300' },
    { id: 'purple', bg: 'bg-purple-500', light: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-500', text: 'text-purple-700 dark:text-purple-300' },
    { id: 'pink', bg: 'bg-pink-500', light: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-500', text: 'text-pink-700 dark:text-pink-300' },
];

const normalizeText = (text: string) =>
    text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const Llibreta: React.FC = () => {
    const { notes, addNote, updateNote, deleteNote, profile, events, deleteEvent, linkNoteToEvent, unlinkNoteFromEvent, fetchLinks } = useData();
    const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [localTitle, setLocalTitle] = useState('');
    const [localContent, setLocalContent] = useState('');
    const [localCategory, setLocalCategory] = useState<string>('General');

    // Modals State
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [eventSearchQuery, setEventSearchQuery] = useState('');
    const [isLinking, setIsLinking] = useState(false);
    const [showAllEvents, setShowAllEvents] = useState(false);

    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
    const [deleteWithEvents, setDeleteWithEvents] = useState(false);

    const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Set initial selected note and fetch links lazily
    useEffect(() => {
        fetchLinks();
        if (notes && notes.length > 0 && !selectedNoteId) {
            setSelectedNoteId(notes[0].id);
        }
    }, [notes, selectedNoteId, fetchLinks]);

    const selectedNote = notes.find(n => n.id === selectedNoteId) as Note | undefined;

    // Sync local state when selected note changes
    useEffect(() => {
        if (selectedNote) {
            setLocalTitle(selectedNote.titol);
            setLocalContent(selectedNote.contingut);
            setLocalCategory(selectedNote.categoria || 'General');
        }
    }, [selectedNoteId, selectedNote]);

    const location = useLocation();

    useEffect(() => {
        if (location.state?.selectedNoteId) {
            setSelectedNoteId(location.state.selectedNoteId);
            // Clear state to avoid re-selecting on every render/navigation
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const filteredNotes = notes.filter(n => {
        if (!n) return false;
        const query = searchQuery.toLowerCase();
        const titol = n?.titol || '';
        const contingut = n?.contingut || '';
        const categoria = n?.categoria || '';

        return (
            titol.toLowerCase().includes(query) ||
            contingut.toLowerCase().includes(query) ||
            (categoria && categoria.toLowerCase().includes(query))
        );
    });

    const linkedEvents = useMemo(() => {
        if (!selectedNote?.linkedEventIds || !events) return [];
        return events.filter(e => selectedNote.linkedEventIds?.includes(e.id));
    }, [selectedNote, events]);

    const availableEvents = useMemo(() => {
        const query = normalizeText(eventSearchQuery);
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Start of today

        return events
            .filter(e => {
                const isAlreadyLinked = selectedNote?.linkedEventIds?.includes(e.id);
                if (isAlreadyLinked) return false;

                // Filter by date: from today onwards
                const eventDate = new Date(e.date);
                eventDate.setHours(0, 0, 0, 0);
                if (eventDate < now) return false;

                // If query is empty, show all (except already linked and past)
                if (!query) return true;

                const eventTitle = normalizeText(e.title);
                const eventSubject = normalizeText(e.subject || '');

                return eventTitle.includes(query) || eventSubject.includes(query);
            })
            .sort((a, b) => {
                // Sort by date (nearest first)
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                if (dateA !== dateB) return dateA - dateB;

                // Then by time
                return (a.time || '').localeCompare(b.time || '');
            })
            .slice(0, 50);
    }, [events, selectedNote, eventSearchQuery]);

    const handleAddNote = async () => {
        const res = await addNote();
        if (res?.data) {
            setSelectedNoteId((res.data as any).id);
            toast.success('Nova nota creada');
        }
    };

    const handleSave = async (showToast = true) => {
        if (!selectedNoteId) return;
        setIsSaving(true);
        await updateNote(selectedNoteId, {
            titol: localTitle,
            contingut: localContent,
            categoria: localCategory
        });
        setIsSaving(false);
        if (showToast) toast.success('Canvis guardats');
    };

    const handleDeleteClick = (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        const note = notes.find(n => n.id === id);
        if (note) {
            setNoteToDelete(note);
            setDeleteWithEvents(false);
            setIsDeleteDialogOpen(true);
        }
    };

    const confirmDelete = async () => {
        if (!noteToDelete) return;

        await deleteNote(noteToDelete.id);

        if (deleteWithEvents && noteToDelete.linkedEventIds) {
            for (const eventId of noteToDelete.linkedEventIds) {
                await deleteEvent(eventId);
            }
        }

        if (selectedNoteId === noteToDelete.id) {
            const remainingNotes = notes.filter(n => n.id !== noteToDelete.id);
            setSelectedNoteId(remainingNotes.length > 0 ? remainingNotes[0].id : null);
        }

        setIsDeleteDialogOpen(false);
        setNoteToDelete(null);
        toast.success('Nota eliminada');
    };

    const handleLinkToEvent = async (eventId: string) => {
        if (!selectedNoteId) return;
        setIsLinking(true);
        const res = await linkNoteToEvent(selectedNoteId, eventId);
        if (!res?.error && res?.data) {
            toast.success('Nota vinculada a l\'esdeveniment');
            setIsLinkModalOpen(false);
        } else {
            console.error('Error vinculant nota:', res?.error);
            toast.error(res?.error?.message || 'Error al vincular la nota. Verifica les taules de Supabase.');
        }
        setIsLinking(false);
    };

    const handleUnlink = async (eventId: string) => {
        if (!selectedNoteId) return;

        await unlinkNoteFromEvent(selectedNoteId, eventId);
        toast.success('Esdeveniment desvinculat');
    };

    // Autosave logic
    useEffect(() => {
        if (!selectedNoteId) return;

        if (selectedNote && (
            localTitle !== selectedNote.titol ||
            localContent !== selectedNote.contingut ||
            localCategory !== (selectedNote.categoria || 'General')
        )) {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

            autosaveTimerRef.current = setTimeout(() => {
                handleSave(false);
            }, 3000);
        }

        return () => {
            if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
        };
    }, [localTitle, localContent, localCategory, selectedNoteId, selectedNote]);

    const urlMatch = localContent.match(/(https?:\/\/[^\s]+|www\.[^\s]+\.[^\s]+|www\.[^\s]+\/?[^\s]*)/gi);

    return (
        <div className="flex h-full gap-4 animate-in fade-in duration-500">
            {/* Columna esquerra: Llistat de notes */}
            <Card className="w-80 flex flex-col bg-card/50 backdrop-blur-sm border-border shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold text-lg text-foreground flex items-center gap-2">
                            <StickyNote className="w-5 h-5 text-primary" />
                            Notes
                        </h2>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="rounded-full hover:bg-primary/10 text-primary"
                            onClick={handleAddNote}
                            title="Nova Nota"
                        >
                            <Plus className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Cerca per títol o matèria..."
                            className="pl-9 bg-background/50 border-border/50 focus-visible:ring-primary/20 rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {!notes || notes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-4 text-center opacity-40">
                            <StickyNote className="w-12 h-12 mb-4" />
                            <p className="text-sm font-bold uppercase tracking-widest">No hi ha cap nota encara</p>
                        </div>
                    ) : (filteredNotes || []).length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 px-4 text-center opacity-40">
                            <Search className="w-8 h-8 mb-2" />
                            <p className="text-xs font-medium">No s'han trobat notes per: "{searchQuery}"</p>
                        </div>
                    ) : (
                        (filteredNotes || []).map((note) => (
                            <div key={note.id} className="group relative">
                                <button
                                    onClick={() => setSelectedNoteId(note.id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${selectedNoteId === note.id
                                        ? 'bg-primary/10 border-l-4 border-l-primary shadow-sm'
                                        : 'hover:bg-secondary/50 border-l-4 border-l-transparent text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <p className={`font-bold text-sm truncate flex-1 ${selectedNoteId === note.id ? 'text-primary' : 'text-foreground'}`}>
                                            {note.titol || '(Sense títol)'}
                                        </p>
                                        {note.categoria && note.categoria !== 'General' && (
                                            <Badge variant="outline" className="text-[8px] px-1 py-0 h-4 bg-primary/5 text-primary border-primary/20 uppercase font-black tracking-tighter shrink-0">
                                                {note.categoria}
                                            </Badge>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1.5 opacity-60">
                                            <Icon name="calendar_today" className="text-[10px]" />
                                            <span className="text-[10px] uppercase font-black tracking-wider">
                                                {note.createdAt ? new Date(note.createdAt).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short' }) : '---'}
                                            </span>
                                        </div>
                                        {note.linkedEventIds && note.linkedEventIds.length > 0 && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3 text-primary opacity-60" />
                                                <span className="text-[9px] font-black text-primary/60">{note.linkedEventIds.length}</span>
                                            </div>
                                        )}
                                    </div>
                                </button>
                                <button
                                    onClick={(e) => handleDeleteClick(note.id, e)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all opacity-0 group-hover:opacity-100"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </Card>

            {/* Columna dreta: Editor */}
            {selectedNote && selectedNote.id ? (
                <Card className="flex-1 flex flex-col bg-white border-border shadow-sm overflow-hidden rounded-[2rem]">
                    <div className="p-6 border-b border-border flex items-center justify-between bg-gradient-to-r from-background to-secondary/20 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 leading-none mb-1">Nota seleccionada</p>
                                <h3 className="font-bold text-lg tracking-tight leading-none truncate max-w-[200px]">{localTitle || '(Edita el títol)'}</h3>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {isSaving && (
                                <div className="flex items-center gap-2 text-primary font-medium text-xs animate-pulse">
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Guardant...
                                </div>
                            )}
                            <Button
                                type="button"
                                className="relative rounded-full px-6 py-5 bg-white border border-primary/20 text-primary-foreground font-bold shadow-lg shadow-primary/5 hover:shadow-primary/10 hover:-translate-y-0.5 transition-all group shrink-0 overflow-hidden"
                                variant="outline"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setIsLinkModalOpen(true);
                                }}
                            >
                                <div className="absolute inset-0 bg-primary opacity-[0.03] group-hover:opacity-[0.06] transition-opacity" />
                                <Calendar className="w-4 h-4 mr-2 text-primary relative z-10" />
                                <span className="text-primary font-bold relative z-10">Vincular al Calendari</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex-1 p-8 flex flex-col space-y-6 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Títol de la nota</label>
                                <Input
                                    value={localTitle}
                                    onChange={(e) => setLocalTitle(e.target.value)}
                                    placeholder="Posa un títol..."
                                    className="border-none bg-transparent h-auto p-0 text-3xl font-black tracking-tight focus-visible:ring-0 placeholder:opacity-20 transition-all focus:translate-x-1"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Etiqueta / Matèria</label>
                                <Select value={localCategory} onValueChange={setLocalCategory}>
                                    <SelectTrigger className="w-full h-10 rounded-xl border-border bg-secondary/20 font-bold text-xs uppercase tracking-wider focus:ring-primary/20">
                                        <SelectValue placeholder="Tria una matèria" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl max-h-[250px] overflow-y-auto">
                                        <SelectItem value="General" className="text-xs font-bold uppercase py-2">General</SelectItem>
                                        {(profile?.subjects || []).map(subject => (
                                            <SelectItem key={subject} value={subject} className="text-xs font-bold uppercase py-2">
                                                {subject}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Event Linking Display */}
                        {linkedEvents.length > 0 && (
                            <div className="space-y-3 shrink-0">
                                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Esdeveniments vinculats</label>
                                <div className="flex flex-wrap gap-2">
                                    {(!linkedEvents || linkedEvents.length === 0) && (
                                        <p className="text-xs text-muted-foreground italic">Cap esdeveniment vinculat</p>
                                    )}
                                    {linkedEvents.map(event => (
                                        <div key={event.id} className="group relative flex items-center gap-2 bg-primary/5 hover:bg-primary/10 border border-primary/10 pl-3 pr-1 py-1 rounded-xl transition-all animate-in zoom-in-95">
                                            <Calendar className="w-3.5 h-3.5 text-primary" />
                                            <div className="flex flex-col">
                                                <span className="text-[11px] font-bold text-primary leading-tight truncate max-w-[120px]">{event.title}</span>
                                                <span className="text-[9px] font-medium text-muted-foreground leading-none">
                                                    {new Date(event.date).toLocaleDateString('ca-ES', { weekday: 'short', day: '2-digit', month: 'short' })} • {event.time}
                                                </span>
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="w-6 h-6 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => handleUnlink(event.id)}
                                            >
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex-1 flex flex-col space-y-2 min-h-[200px]">
                            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground ml-1">Contingut</label>
                            <div className="flex-1 flex flex-col gap-4">
                                <Textarea
                                    value={localContent}
                                    onChange={(e) => setLocalContent(e.target.value)}
                                    placeholder="Comença a escriure aquí les teves idees..."
                                    className="flex-1 border-none bg-secondary/5 p-6 text-lg leading-relaxed focus-visible:ring-0 resize-none font-medium text-foreground/80 placeholder:italic placeholder:opacity-30 rounded-[2rem] shadow-inner"
                                />

                                {urlMatch && (
                                    <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 shadow-sm group/link">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0 transition-transform group-hover/link:scale-110 shadow-inner">
                                            {(() => {
                                                const url = urlMatch[0].toLowerCase();
                                                if (url.includes('youtube.com') || url.includes('youtu.be')) return <Youtube className="w-5 h-5" />;
                                                if (url.includes('docs.google.com/document')) return <FileText className="w-5 h-5" />;
                                                if (url.includes('docs.google.com/presentation')) return <Presentation className="w-5 h-5" />;
                                                if (url.includes('docs.google.com/spreadsheets')) return <TableProperties className="w-5 h-5" />;
                                                if (url.includes('drive.google.com')) return <Cloud className="w-5 h-5" />;
                                                return <LinkIcon className="w-5 h-5" />;
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 leading-none mb-1">Enllaç detectat</p>
                                            <div className="text-sm font-bold text-primary truncate">
                                                {urlMatch[0]}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground mt-0.5 italic">Clica per obrir el recurs</p>
                                        </div>
                                        <a
                                            href={urlMatch[0].startsWith('http') ? urlMatch[0] : 'https://' + urlMatch[0]}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="h-10 w-10 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all border border-primary/10 shadow-sm active:scale-90"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-secondary/10 border-t border-border flex justify-between items-center shrink-0">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground font-medium">
                            <span className="flex items-center gap-1.5">
                                <Icon name="history" className="text-base" />
                                Darrera edició: {selectedNote?.updatedAt ? new Date(selectedNote.updatedAt).toLocaleTimeString('ca-ES', { hour: '2-digit', minute: '2-digit' }) : '---'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                className="rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                                onClick={() => selectedNote && handleDeleteClick(selectedNote.id)}
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Eliminar
                            </Button>
                            <Button
                                className="rounded-xl px-8 font-bold shadow-lg shadow-primary/20"
                                onClick={() => handleSave()}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Guardar
                            </Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <Card className="flex-1 flex flex-col items-center justify-center bg-white border-border shadow-sm rounded-[2rem] p-12 text-center">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6">
                        <StickyNote className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight mb-2">No hi ha cap nota seleccionada</h3>
                    <p className="text-muted-foreground max-w-xs mb-8">Selecciona una nota de la llista o crea'n una de nova per començar a escriure.</p>
                    <Button type="button" onClick={handleAddNote} className="rounded-2xl px-8 py-6 font-bold text-lg shadow-xl shadow-primary/20">
                        <Plus className="w-5 h-5 mr-2" />
                        Crear la meva primera nota
                    </Button>
                </Card>
            )}



            {/* Deletion Modal */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden font-sans">
                    <div className="bg-destructive/5 p-8 border-b border-destructive/10">
                        <AlertDialogHeader>
                            <div className="w-12 h-12 rounded-2xl bg-destructive flex items-center justify-center text-white shadow-lg mb-4">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <AlertDialogTitle className="text-2xl font-black tracking-tight">Eliminar Nota</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground font-medium">
                                Segur que vols eliminar la nota <span className="text-foreground font-bold underline">"{noteToDelete?.titol || '(Sense títol)'}"</span>?
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                    </div>

                    {noteToDelete?.linkedEventIds && noteToDelete.linkedEventIds.length > 0 && (
                        <div className="p-8 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
                            <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">!</div>
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-amber-900">Aquesta nota té {noteToDelete.linkedEventIds.length} vinculacions</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="delete-events"
                                        checked={deleteWithEvents}
                                        onChange={(e) => setDeleteWithEvents(e.target.checked)}
                                        className="w-4 h-4 rounded border-amber-300 text-amber-600"
                                    />
                                    <label htmlFor="delete-events" className="text-xs font-bold text-amber-700 cursor-pointer">
                                        Eliminar també els esdeveniments del calendari
                                    </label>
                                </div>
                                <p className="text-[10px] text-amber-600 italic">Atenció: Això esborrarà permanentment els esdeveniments del calendari.</p>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter className="p-8 bg-white flex gap-3">
                        <AlertDialogCancel className="flex-1 h-12 rounded-xl font-bold border-border">Cancel·lar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="flex-1 h-12 rounded-xl font-bold bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/20 border-none">
                            Eliminar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Event Link Modal (Search Existing) */}
            <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem] border-none shadow-2xl overflow-hidden p-0 font-sans">
                    <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-8 border-b border-primary/10">
                        <DialogHeader>
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg mb-4">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <DialogTitle className="text-2xl font-black tracking-tight mb-1">Vincular a Esdeveniment</DialogTitle>
                            <p className="text-muted-foreground text-sm font-medium italic">Cerca un esdeveniment per anclar aquesta nota.</p>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Cerca esdeveniments per nom o matèria..."
                                    className="pl-9 h-12 rounded-xl bg-secondary/20 border-border/50 font-bold focus:ring-primary/20"
                                    value={eventSearchQuery}
                                    onChange={(e) => setEventSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                            {availableEvents.map(event => {
                                const colorStyle = EVENT_COLORS.find(c => c.id === event.color) || EVENT_COLORS[1];
                                return (
                                    <button
                                        key={event.id}
                                        onClick={() => handleLinkToEvent(event.id)}
                                        disabled={isLinking}
                                        className={`w-full text-left p-4 rounded-3xl border-2 transition-all flex items-center justify-between group disabled:opacity-50 bg-white shadow-sm ${colorStyle.border} hover:shadow-md hover:scale-[1.01]`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-white transition-colors shadow-inner ${colorStyle.bg}`}>
                                                <span className="text-[9px] font-black uppercase leading-none opacity-80">{new Date(event.date).toLocaleDateString('ca-ES', { month: 'short' })}</span>
                                                <span className="text-lg font-black leading-tight">{new Date(event.date).getDate()}</span>
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    {event.subject && (
                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${colorStyle.bg} text-white`}>
                                                            {event.subject}
                                                        </span>
                                                    )}
                                                    <span className={`text-[9px] font-bold uppercase ${colorStyle.text}`}>{event.time}</span>
                                                </div>
                                                <p className="text-sm font-black text-foreground leading-tight group-hover:text-primary transition-colors">{event.title}</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mt-0.5">
                                                    {new Date(event.date).toLocaleDateString('ca-ES', { weekday: 'long' })}
                                                </p>
                                            </div>
                                        </div>
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${colorStyle.light} group-hover:bg-primary group-hover:text-white`}>
                                            {isLinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-5 h-5" />}
                                        </div>
                                    </button>
                                );
                            })}
                            {availableEvents.length === 0 && (
                                <div className="py-20 text-center">
                                    <div className="w-16 h-16 bg-secondary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-muted-foreground opacity-20" />
                                    </div>
                                    <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-40">No hi ha esdeveniments</p>
                                    {!showAllEvents && (
                                        <button
                                            onClick={() => setShowAllEvents(true)}
                                            className="mt-4 text-[10px] font-bold text-primary hover:underline uppercase tracking-tighter"
                                        >
                                            Cerca a tot el calendari
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-secondary/10">
                        <Button variant="ghost" onClick={() => setIsLinkModalOpen(false)} className="w-full h-12 rounded-xl font-bold text-muted-foreground hover:bg-white transition-all">
                            Tancar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default Llibreta;
