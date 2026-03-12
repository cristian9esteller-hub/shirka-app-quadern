import React, { useState, useEffect } from 'react';
import Icon from './Icon';
import { UserProfile } from '@/types';
import { useAuth } from '@/hooks/useAuth';

interface SMTPConfigModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: UserProfile['smtpSettings'];
    onSave: (settings: UserProfile['smtpSettings']) => Promise<void>;
}

const SMTPConfigModal: React.FC<SMTPConfigModalProps> = ({ isOpen, onClose, settings, onSave }) => {
    const { user: authUser } = useAuth();
    const [formData, setFormData] = useState(settings || {
        enabled: true,
        host: '',
        port: 587,
        user: '',
        password: '',
        fromName: '',
        fromEmail: ''
    });

    const [showHelp, setShowHelp] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Al carregar el modal, si l'email està buit, posem el de l'usuari de l'app
    useEffect(() => {
        if (isOpen && !formData.user && authUser?.email) {
            handleEmailChange(authUser.email);
        }
    }, [isOpen, authUser?.email]);

    if (!isOpen) return null;

    const handleEmailChange = (email: string) => {
        let host = 'smtp.gmail.com';
        let port = 587;

        if (email.includes('@outlook') || email.includes('@hotmail')) {
            host = 'smtp.office365.com';
        } else if (email.includes('@yahoo')) {
            host = 'smtp.mail.yahoo.com';
            port = 465;
        }

        setFormData(prev => ({
            ...prev,
            user: email,
            fromEmail: email,
            host,
            port,
            enabled: true
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Assegurem que està activat si s'ha posat password
            const finalSettings = {
                ...formData,
                enabled: formData.password ? true : formData.enabled
            };
            await onSave(finalSettings);
            onClose();
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white text-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-[360px] overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100">
                <div className="p-7 text-center space-y-5">
                    <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-1">
                        <Icon name="mail" className="w-6 h-6" />
                    </div>

                    <h2 className="text-lg font-bold tracking-tight px-2 leading-tight text-slate-800">
                        Configura el teu correu per enviar missatges
                    </h2>

                    <div className="space-y-4 pt-2">
                        <div className="text-left space-y-1.5 px-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Email</label>
                            <input
                                type="email"
                                value={formData.user}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                placeholder="exemple@gmail.com"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all font-medium"
                            />
                        </div>

                        <div className="text-left space-y-1.5 px-1 relative">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Clau de seguretat</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                placeholder="•••• •••• •••• ••••"
                                className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-4 text-sm outline-none focus:ring-1 focus:ring-primary/20 transition-all font-mono tracking-wider"
                            />
                        </div>

                        <div className="px-1 text-left">
                            <button
                                type="button"
                                onClick={() => setShowHelp(true)}
                                className="text-[11px] font-bold text-primary hover:underline"
                            >
                                Com puc aconseguir la meva clau de Gmail?
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 text-xs text-slate-400 font-bold hover:text-slate-600 transition-colors"
                        >
                            Cancel·lar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving}
                            className="flex-[1.5] bg-primary text-white text-xs font-bold py-3 rounded-2xl shadow-lg shadow-primary/10 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {isSaving ? "Guardant..." : "Guardar canvis"}
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Guia d'Ajuda Neta */}
            {showHelp && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-[320px] p-8 space-y-6 animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 tracking-tight">Guia ràpida (Gmail)</h3>
                            <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                                <Icon name="close" className="text-lg" />
                            </button>
                        </div>

                        <div className="space-y-5">
                            <div className="flex gap-4 items-start">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex shrink-0 items-center justify-center font-bold text-primary text-xs">1</div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Vés al teu compte de Google i activa la <strong>"Verificació en 2 passos"</strong>.
                                </p>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex shrink-0 items-center justify-center font-bold text-primary text-xs">2</div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Busca <strong>"Contrasenyes d'aplicació"</strong> a la secció de Seguretat.
                                </p>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="w-6 h-6 rounded-full bg-primary/10 flex shrink-0 items-center justify-center font-bold text-primary text-xs">3</div>
                                <p className="text-xs text-slate-600 leading-relaxed">
                                    Crea'n una per a <strong>"Correu"</strong> i copia aquí la clau de 16 lletres.
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowHelp(false)}
                            className="w-full bg-slate-100 text-slate-800 font-bold py-3 rounded-xl hover:bg-slate-200 transition-all text-xs"
                        >
                            Entès!
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SMTPConfigModal;
