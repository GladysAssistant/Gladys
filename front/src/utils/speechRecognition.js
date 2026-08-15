import { AVAILABLE_LANGUAGES } from '../../../server/utils/constants';
import { isSecureRecordingContext } from './speechMicrophoneAccess';

/**
 * Locale used for each Gladys language when the browser language does not
 * match the language the user picked in Gladys.
 */
const DEFAULT_RECOGNITION_LOCALES = {
  [AVAILABLE_LANGUAGES.EN]: 'en-US',
  [AVAILABLE_LANGUAGES.FR]: 'fr-FR',
  [AVAILABLE_LANGUAGES.DE]: 'de-DE'
};

/**
 * @description Returns the browser SpeechRecognition constructor when available.
 * Speech recognition is prefixed in Chromium based browsers.
 * @returns {Function|null} The constructor, or null when unsupported.
 */
export function getSpeechRecognitionConstructor() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * @description Whether speech recognition can be used in this browser.
 * The API needs a secure context (HTTPS or localhost) to get the microphone.
 * @returns {boolean} True when speech recognition is usable.
 */
export function isSpeechRecognitionSupported() {
  if (!isSecureRecordingContext()) {
    return false;
  }
  return getSpeechRecognitionConstructor() !== null;
}

/**
 * @description Pick the BCP 47 locale used to transcribe the user voice.
 * The language selected in Gladys wins, and the full browser locale is kept
 * when it matches it, so a French speaking user in Canada keeps fr-CA.
 * @param {string} [language] - Language of the Gladys user (en, fr, de).
 * @returns {string} Locale to give to the speech recognition engine.
 * @example getSpeechRecognitionLocale('fr');
 */
export function getSpeechRecognitionLocale(language) {
  const browserLocale = typeof navigator !== 'undefined' ? navigator.language : null;
  if (language) {
    if (browserLocale && browserLocale.split('-', 1)[0] === language) {
      return browserLocale;
    }
    if (DEFAULT_RECOGNITION_LOCALES[language]) {
      return DEFAULT_RECOGNITION_LOCALES[language];
    }
  }
  return browserLocale || DEFAULT_RECOGNITION_LOCALES[AVAILABLE_LANGUAGES.EN];
}

/**
 * @description Translate a SpeechRecognition error code to a Gladys i18n key suffix.
 * @param {string} error - Error code given by the browser.
 * @returns {string|null} i18n key suffix, or null when the error must be ignored.
 * @example getSpeechRecognitionErrorKey('not-allowed');
 */
export function getSpeechRecognitionErrorKey(error) {
  switch (error) {
    case 'aborted':
      // The user stopped the recognition himself, this is not an error.
      return null;
    case 'no-speech':
      return 'errorNoSpeech';
    case 'not-allowed':
    case 'service-not-allowed':
      return 'errorPermissionDenied';
    case 'audio-capture':
      return 'errorNoMicrophone';
    case 'network':
      return 'errorNetwork';
    default:
      return 'error';
  }
}

/**
 * @description Create a speech recognition session writing what the user says in a text input.
 * @param {object} options - Session options.
 * @param {string} [options.language] - Language of the Gladys user (en, fr, de).
 * @param {Function} options.onTranscript - Called with the transcript each time it changes.
 * @param {Function} [options.onError] - Called with an i18n key suffix when recognition fails.
 * @param {Function} [options.onEnd] - Called when the browser stopped listening.
 * @returns {object|null} Session with start/stop methods, or null when unsupported.
 * @example createSpeechRecognition({ language: 'fr', onTranscript: console.log });
 */
export function createSpeechRecognition({ language, onTranscript, onError, onEnd }) {
  const SpeechRecognitionConstructor = getSpeechRecognitionConstructor();
  if (!SpeechRecognitionConstructor) {
    return null;
  }

  const recognition = new SpeechRecognitionConstructor();
  recognition.lang = getSpeechRecognitionLocale(language);
  // Keep listening between sentences, browsers that don't support it simply
  // stop on the first silence, which is a fine behaviour too.
  recognition.continuous = true;
  // Display words as they are recognized instead of waiting for the full sentence.
  recognition.interimResults = true;

  let finalTranscript = '';
  let stopped = false;

  recognition.onresult = event => {
    let interimTranscript = '';
    for (let i = event.resultIndex; i < event.results.length; i += 1) {
      const result = event.results[i];
      const { transcript } = result[0];
      if (result.isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }
    onTranscript(`${finalTranscript}${interimTranscript}`);
  };

  recognition.onerror = event => {
    const errorKey = getSpeechRecognitionErrorKey(event.error);
    if (errorKey && onError) {
      onError(errorKey);
    }
  };

  recognition.onend = () => {
    if (onEnd) {
      onEnd();
    }
  };

  return {
    start() {
      try {
        recognition.start();
      } catch (e) {
        // start() throws when the recognition is already running, nothing to do.
        console.error(e);
      }
    },
    stop() {
      if (stopped) {
        return;
      }
      stopped = true;
      try {
        recognition.stop();
      } catch (e) {
        console.error(e);
      }
    },
    abort() {
      if (stopped) {
        return;
      }
      stopped = true;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.abort();
      } catch (e) {
        console.error(e);
      }
    }
  };
}
