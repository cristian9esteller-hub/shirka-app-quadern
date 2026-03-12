import React from 'react';
import Icon from '@/components/Icon';
import { motion } from 'framer-motion';

const PrivacyPolicy: React.FC = () => {
    return (
        <div className="w-full max-w-4xl mx-auto space-y-8 pb-12">
            <header className="space-y-2">
                <h1 className="text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight uppercase">
                    Política de Privadesa
                </h1>
                <p className="text-slate-400 dark:text-slate-500 font-bold text-sm uppercase tracking-widest">
                    Darrera actualització: 1 de Març de 2026
                </p>
            </header>

            <div className="grid gap-6">
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <Icon name="security" className="text-xl" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            El nostre compromís
                        </h2>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        A SHIRKA, la teva privadesa i la dels teus alumnes és la nostra prioritat absoluta.
                        Com a eina dissenyada per a docents, entenem la sensibilitat de la informació educativa
                        y apliquem els estàndards més alts de seguretat.
                    </p>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    className="bg-white dark:bg-card rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/40 dark:shadow-none border border-slate-100 dark:border-slate-800 space-y-6"
                >
                    <div className="space-y-4">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">
                            1. Recollida de Dades
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Recollim exclusivament la informació necessària per al funcionament de l'aplicació:
                            nom del docent, adreça de correu electrònic i les dades dels alumnes que tu decideixis introduir.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">
                            2. Ús de la Informació
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Les teves dades mai seran venudes a tercers. S'utilitzen exclusivament per
                            oferir-te les funcionalitats de quadern digital, avaluació i gestió d'aula.
                        </p>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                        <h3 className="text-sm font-black uppercase tracking-widest text-primary">
                            3. Seguretat i Supabase
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                            Tota la teva informació s'emmagatzema de forma segura mitjançant Supabase,
                            utilitzant polítiques d'accés a nivell de fila (RLS) que garanteixen que
                            només tu puguis veure i editar les teves dades.
                        </p>
                    </div>
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-primary/5 dark:bg-primary/10 rounded-[2.5rem] p-8 border border-primary/20 space-y-4"
                >
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20">
                            <Icon name="info" className="text-xl" />
                        </div>
                        <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            Contacte
                        </h2>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                        Si tens qualsevol dubte sobre com tractem les dades, pots posar-te en contacte
                        amb el nostre equip de suport a través de la secció de Missatgeria o enviant
                        un correu a <span className="text-primary font-bold">suport@shirka.cat</span>.
                    </p>
                </motion.section>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
