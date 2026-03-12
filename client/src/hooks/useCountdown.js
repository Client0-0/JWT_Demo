import { useState, useEffect } from 'react';

/**
 * A custom hook that returns a the remaining seconds and a formatted "mm:ss" string until the target timestamp.
 * @param {number} targetTimestamp - The unix timestamp (in milliseconds) to count down to.
 * @returns {object} { isExpired: boolean, formattedTime: string, remainingSeconds: number }
 */
export function useCountdown(targetTimestamp) {
    // Initialize from the target immediately to avoid a false isExpired=true flash on the first render
    const [remainingSeconds, setRemainingSeconds] = useState(() => {
        if (!targetTimestamp) return 0;
        return Math.max(0, Math.floor((targetTimestamp - Date.now()) / 1000));
    });

    useEffect(() => {
        if (!targetTimestamp) {
            setRemainingSeconds(0);
            return;
        }

        const calculateRemaining = () => {
            const now = Date.now();
            const diff = targetTimestamp - now;
            return Math.max(0, Math.floor(diff / 1000));
        };

        // Initialize immediately
        setRemainingSeconds(calculateRemaining());

        // Update every 1 second
        const interval = setInterval(() => {
            const remaining = calculateRemaining();
            setRemainingSeconds(remaining);

            // Clear interval if we hit 0
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [targetTimestamp]);

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return {
        isExpired: remainingSeconds <= 0 && !!targetTimestamp,
        formattedTime,
        remainingSeconds
    };
}
