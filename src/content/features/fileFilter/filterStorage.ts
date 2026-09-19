const STORAGE_KEY =
    "gev-file-filter-enabled";

export async function getFileFilterEnabled():
    Promise<boolean> {
    try {
        const result =
            await chrome.storage.local.get(
                STORAGE_KEY
            );

        return result[STORAGE_KEY] === true;
    } catch (error) {
        console.error(
            "[GitHub Enhanced View] Could not load file filter settings.",
            error
        );

        return false;
    }
}

export async function setFileFilterEnabled(
    enabled: boolean
): Promise<void> {
    try {
        await chrome.storage.local.set({
            [STORAGE_KEY]: enabled
        });
    } catch (error) {
        console.error(
            "[GitHub Enhanced View] Could not save file filter settings.",
            error
        );
    }
}