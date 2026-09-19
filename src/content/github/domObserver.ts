type RepositoryChangeCallback = () => void;

export function observeGitHubDom(
    callback: RepositoryChangeCallback
): MutationObserver {
    let animationFrameId:
        number | undefined;

    const scheduleCallback = (): void => {
        if (animationFrameId !== undefined) {
            window.cancelAnimationFrame(
                animationFrameId
            );
        }

        animationFrameId =
            window.requestAnimationFrame(
                () => {
                    animationFrameId =
                        undefined;

                    callback();
                }
            );
    };

    const observer =
        new MutationObserver(() => {
            scheduleCallback();
        });

    observer.observe(
        document.body,
        {
            childList: true,
            subtree: true
        }
    );

    return observer;
}