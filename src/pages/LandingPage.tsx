import React from 'react';
import { motion } from 'framer-motion';
import Icon from '@/components/Icon';

interface LandingPageProps {
    onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Icon name="auto_stories" className="text-primary text-2xl" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">SHIRKA</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onGetStarted}
                            className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Iniciar sessió
                        </button>
                        <button
                            onClick={onGetStarted}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-bold shadow-lg hover:shadow-primary/20 transition-all hover:-translate-y-0.5"
                        >
                            Comença Ara
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 md:pt-48 md:pb-32 overflow-hidden">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 opacity-30 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/40 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/30 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-5xl mx-auto text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <span className="inline-block px-4 py-1.5 mb-6 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                            La teva aula, en un sol lloc
                        </span>
                        <h1 className="text-5xl md:text-7xl font-bold mb-8 tracking-tight">
                            Gestiona el teu dia a dia <br />
                            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                                sense complicacions.
                            </span>
                        </h1>
                        <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                            Shirka és el quadern digital del mestre pensat per estalviar temps. Control d'assistència, avaluacions, seguiment d'alumnes i molt més.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <button
                                onClick={onGetStarted}
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-primary-foreground rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                            >
                                Prova-ho gratis
                            </button>
                            <button className="w-full sm:w-auto px-8 py-4 bg-secondary text-foreground rounded-2xl text-lg font-bold hover:bg-secondary/80 transition-all">
                                Veure demo
                            </button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-4 bg-card/50">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Tot el que necessites</h2>
                        <p className="text-muted-foreground">Eines dissenyades per a les necessitats reals dels docents.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { icon: 'groups', title: 'Gestió d\'Alumnes', desc: 'Fitxes completes, fotos i seguiment personalitzat de cada alumne.' },
                            { icon: 'assignment_turned_in', title: 'Avaluació Ràpida', desc: 'Crea activitats i posa notes en segons amb la nostra interfície intuïtiva.' },
                            { icon: 'calendar_today', title: 'Calendari i Tasques', desc: 'No perdis mai de vista les teves reunions, exàmens o deures pendents.' },
                            { icon: 'how_to_reg', title: 'Assistència', desc: 'Passa llista amb un sol clic i genera informes automàtics d\'absències.' },
                            { icon: 'forum', title: 'Missatgeria', desc: 'Mantén la comunicació amb les famílies sense intercanviar números personals.' },
                            { icon: 'insights', title: 'Estadístiques', desc: 'Visualitza el progrés de la teva classe amb gràfics i mitjanes automàtiques.' },
                        ].map((f, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                viewport={{ once: true }}
                                className="p-8 rounded-3xl bg-background border border-border/50 hover:border-primary/50 transition-all group"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <Icon name={f.icon} className="text-primary text-2xl" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{f.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-border mt-20">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <Icon name="auto_stories" className="text-primary text-2xl" />
                        <span className="text-xl font-bold tracking-tight">SHIRKA</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Shirka Notes. Creat per docents, per a docents.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
