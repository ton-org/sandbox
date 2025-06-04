import chalk, { supportsColor } from 'chalk';

import { DeltaMetric } from './deltaResult';

export function defaultColor(metric: DeltaMetric) {
    if (!supportsColor) {
        return metric.value;
    }
    const { green, redBright, gray, yellowBright } = chalk;
    let color = gray;
    if (metric.kind === 'decrease') {
        color = green;
    } else if (metric.kind === 'increase') {
        color = redBright;
    } else if (metric.kind === 'undefined') {
        color = yellowBright;
    }
    return color(metric.value);
}
