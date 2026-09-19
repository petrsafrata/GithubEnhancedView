export interface FileIconDefinition {
    path: string;
    label: string;
}

function createDefinition(
    iconName: string,
    label: string
): FileIconDefinition {
    return {
        path: `dist/icons/${iconName}.svg`,
        label
    };
}

const extensionIconMap:
    Record<string, FileIconDefinition> = {
        js: createDefinition(
            "javascript",
            "JavaScript"
        ),

        mjs: createDefinition(
            "javascript",
            "JavaScript module"
        ),

        cjs: createDefinition(
            "javascript",
            "CommonJS"
        ),

        ts: createDefinition(
            "typescript",
            "TypeScript"
        ),

        mts: createDefinition(
            "typescript",
            "TypeScript module"
        ),

        cts: createDefinition(
            "typescript",
            "CommonJS TypeScript"
        ),

        jsx: createDefinition(
            "react",
            "React JSX"
        ),

        tsx: createDefinition(
            "react-ts",
            "React TSX"
        ),

        java: createDefinition(
            "java",
            "Java"
        ),

        py: createDefinition(
            "python",
            "Python"
        ),

        php: createDefinition(
            "php",
            "PHP"
        ),

        c: createDefinition(
            "c",
            "C"
        ),

        cs: createDefinition(
            "csharp",
            "C#"
        ),

        json: createDefinition(
            "json",
            "JSON"
        ),

        md: createDefinition(
            "markdown",
            "Markdown"
        ),

        html: createDefinition(
            "html",
            "HTML"
        ),

        htm: createDefinition(
            "html",
            "HTML"
        ),

        css: createDefinition(
            "css",
            "CSS"
        ),

        scss: createDefinition(
            "css",
            "SCSS"
        ),

        sass: createDefinition(
            "css",
            "Sass"
        ),

        sql: createDefinition(
            "database",
            "SQL"
        ),

        xml: createDefinition(
            "xml",
            "XML"
        ),

        yml: createDefinition(
            "yaml",
            "YAML"
        ),

        yaml: createDefinition(
            "yaml",
            "YAML"
        ),

        pdf: createDefinition(
            "pdf",
            "PDF"
        ),

        ps1: createDefinition(
            "powershell",
            "PowerShell"
        ),

        cmd: createDefinition(
            "command",
            "Windows Command Script"
        ),

        bat: createDefinition(
            "command",
            "Windows Batch Script"
        ),

        ejs: createDefinition(
            "ejs",
            "EJS"
        ),

        zig: createDefinition(
            "zig",
            "Zig"
        ),

        log: createDefinition(
            "log",
            "Log file"
        ),

        exe: createDefinition(
            "exe",
            "Executable"
        ),

        razor: createDefinition(
            "razor",
            "Razor"
        )
    };

const filenameIconMap:
    Record<string, FileIconDefinition> = {
        dockerfile: createDefinition(
            "docker",
            "Docker"
        ),

        makefile: createDefinition(
            "makefile",
            "Makefile"
        ),

        ".gitignore": createDefinition(
            "git",
            "Git ignore"
        ),

        ".gitattributes": createDefinition(
            "git",
            "Git attributes"
        ),

        ".npmrc": createDefinition(
            "npm",
            "NPM configuration"
        ),

        "package.json": createDefinition(
            "npm",
            "NPM package"
        ),

        "package-lock.json": createDefinition(
            "npm",
            "NPM package lock"
        ),

        "pom.xml": createDefinition(
            "maven",
            "Maven project"
        ),

        "readme.md": createDefinition(
            "readme",
            "README"
        ),

        license: createDefinition(
            "license",
            "License"
        ),

        "license.md": createDefinition(
            "license",
            "License"
        ),

        "license.txt": createDefinition(
            "license",
            "License"
        ),

        "vite.config.ts": createDefinition(
            "vite",
            "Vite configuration"
        ),

        "vite.config.js": createDefinition(
            "vite",
            "Vite configuration"
        ),

        "vite-env.d.ts": createDefinition(
            "vite",
            "Vite environment"
        ),

        "tailwind.config.js": createDefinition(
            "tailwindcss",
            "Tailwind CSS configuration"
        ),

        "tailwind.config.ts": createDefinition(
            "tailwindcss",
            "Tailwind CSS configuration"
        ),

        "postcss.config.js": createDefinition(
            "postcss",
            "PostCSS configuration"
        ),

        "postcss.config.cjs": createDefinition(
            "postcss",
            "PostCSS configuration"
        ),

        "jsconfig.json": createDefinition(
            "jsconfig",
            "JavaScript configuration"
        ),

        "tsconfig.json": createDefinition(
            "typescript",
            "TypeScript configuration"
        ),

        jenkinsfile: createDefinition(
            "jenkins",
            "Jenkins"
        ),

        "robots.txt": createDefinition(
            "robots",
            "Robots"
        )
    };

function getSpecialFilenameIcon(
    normalizedFilename: string
): FileIconDefinition | null {
    if (
        normalizedFilename.startsWith(
            "docker-compose"
        )
    ) {
        return createDefinition(
            "docker",
            "Docker Compose"
        );
    }

    if (
        normalizedFilename.startsWith(
            "tsconfig"
        ) &&
        normalizedFilename.endsWith(".json")
    ) {
        return createDefinition(
            "typescript",
            "TypeScript configuration"
        );
    }

    if (
        normalizedFilename.startsWith(
            "readme"
        )
    ) {
        return createDefinition(
            "readme",
            "README"
        );
    }

    if (
        normalizedFilename.startsWith(
            "license"
        )
    ) {
        return createDefinition(
            "license",
            "License"
        );
    }

    return null;
}

export function getFileIcon(
    filename: string,
    extension?: string
): FileIconDefinition | null {
    const normalizedFilename =
        filename.toLowerCase();

    const byFilename =
        filenameIconMap[
            normalizedFilename
        ];

    if (byFilename) {
        return byFilename;
    }

    const specialFilenameIcon =
        getSpecialFilenameIcon(
            normalizedFilename
        );

    if (specialFilenameIcon) {
        return specialFilenameIcon;
    }

    if (!extension) {
        return null;
    }

    return (
        extensionIconMap[
            extension.toLowerCase()
        ] ?? null
    );
}