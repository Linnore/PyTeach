import sys
import pyaudio
from dashscope.api_entities.dashscope_response import SpeechSynthesisResponse
from dashscope.audio.tts import ResultCallback, SpeechSynthesisResult
from dashscope.audio.tts import SpeechSynthesizer  # noqa
import re


def markdown_to_plain_text(markdown_text):
    # Remove image links
    text = re.sub(r'!\[.*?\]\(.*?\)', '', markdown_text)
    # Remove header markers
    text = re.sub(r'#+\s*', '', text)
    # Remove bold and italic markers
    text = re.sub(r'\*+|\_+', '', text)
    # Remove code block markers
    text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
    # Remove inline code markers
    text = re.sub(r'`.*?`', '', text)
    # Remove blockquote markers
    text = re.sub(r'>\s*', '', text)
    # Remove list markers
    text = re.sub(r'-\s*|\*\s*', '', text)
    # Remove extra new lines
    text = re.sub(r'\n+', '\n', text).strip()
    return text


class TTSCallback(ResultCallback):
    _player = None
    _stream = None

    def on_open(self):
        print('Speech synthesizer is opened.')
        self._player = pyaudio.PyAudio()
        self._stream = self._player.open(format=pyaudio.paInt16,
                                         channels=1,
                                         rate=48000,
                                         output=True)

    def on_complete(self):
        print('Speech synthesizer is completed.')

    def on_error(self, response: SpeechSynthesisResponse):
        print('Speech synthesizer failed, response is %s' % (str(response)))

    def on_close(self):
        print('Speech synthesizer is closed.')
        self._stream.stop_stream()
        self._stream.close()
        self._player.terminate()

    def on_event(self, result: SpeechSynthesisResult):
        if result.get_audio_frame() is not None:
            print('audio result length:',
                  sys.getsizeof(result.get_audio_frame()))
            self._stream.write(result.get_audio_frame())

        if result.get_timestamp() is not None:
            print('timestamp result:', str(result.get_timestamp()))
