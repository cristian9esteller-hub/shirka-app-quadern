/**
 * Configuració del curs escolar actual.
 * Modifica aquestes dates per actualitzar el curs sense canviar el codi.
 */
export const DEFAULT_SCHOOL_CONFIG = {
    startDate: '2025-09-08',
    endDate: '2026-06-22',
};

/**
 * Valida si una data cau dins del curs escolar.
 */
export const isWithinSchoolYear = (date: Date | string, config = DEFAULT_SCHOOL_CONFIG): boolean => {
    const d = typeof date === 'string' ? new Date(date + 'T00:00:00') : date;
    const start = new Date(config.startDate + 'T00:00:00');
    const end = new Date(config.endDate + 'T00:00:00');
    return d >= start && d <= end;
};

/**
 * Retorna si la data actual està fora del curs escolar (vacances).
 */
export const isSummerVacation = (config = DEFAULT_SCHOOL_CONFIG): boolean => {
    const now = new Date();
    const month = now.getMonth(); // 0-indexed, 6 = juliol, 7 = agost

    // Si estem fora del rang definit
    const isOutsideRange = !isWithinSchoolYear(now, config);

    // Per defecte considerem juliol i agost com a vacances "segures"
    return isOutsideRange && (month === 6 || month === 7);
};

/**
 * Obté la llista de mesos compresos en el curs escolar (números 0-11).
 */
export const getSchoolMonths = (config = DEFAULT_SCHOOL_CONFIG): number[] => {
    const start = new Date(config.startDate + 'T00:00:00');
    const end = new Date(config.endDate + 'T00:00:00');
    const months: number[] = [];

    let current = new Date(start.getFullYear(), start.getMonth(), 1);
    const finish = new Date(end.getFullYear(), end.getMonth(), 1);

    while (current <= finish) {
        months.push(current.getMonth());
        current.setMonth(current.getMonth() + 1);
    }

    return months;
};

/**
 * Lògica per detectar festius per blocs (rangs de dates).
 */
export interface DateRange {
    startDate: string;
    endDate: string;
}

export const isDateInRange = (dateStr: string, range: DateRange): boolean => {
    const target = new Date(dateStr + 'T00:00:00');
    const start = new Date(range.startDate + 'T00:00:00');
    const end = new Date(range.endDate + 'T00:00:00');
    return target >= start && target <= end;
};
