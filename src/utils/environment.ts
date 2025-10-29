export function isBrowser(): boolean {
    // eslint-disable-next-line no-undef
    return typeof window !== 'undefined' && typeof window.document !== 'undefined';
}

const converters = {
    boolean: (value: string | undefined) => {
        if (!value) return;

        return value.toLowerCase() === 'true';
    },
    string: (value: string | undefined) => value,
} as const;

type Converters = typeof converters;

export function getOptionalEnv<EnvType extends keyof Converters = 'string'>(
    envName: string,
    envType?: EnvType,
): ReturnType<Converters[EnvType]> | undefined {
    if (!process || !process.env) return undefined as ReturnType<Converters[EnvType]>;

    const converter = envType ? converters[envType] : converters.string;

    return converter(process.env[envName]) as ReturnType<Converters[EnvType]>;
}
