import Cookies from 'js-cookie';
import CryptoJS from 'crypto-js';

const DEVICE_TOKEN_KEY = 'device_token';

/**
 * Get the existing token or create a new one, store it in a cookie, and return it
 */
export const getDeviceToken = (): string => {
    let deviceToken = Cookies.get(DEVICE_TOKEN_KEY);

    // If there is no token, create a new one.
    if (!deviceToken) {
        deviceToken = CryptoJS.lib.WordArray.random(18).toString();

        Cookies.set(DEVICE_TOKEN_KEY, deviceToken, { 
            expires: 365, 
            path: '/',
            sameSite: 'lax',
            secure: true
        });
    }

    return deviceToken;
};