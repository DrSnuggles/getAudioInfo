/*	getSamplerate by DrSnuggles
	License : WTFPL 2.0, Beerware Revision 42

	WebAudio lags of information which samplerate was used in original source
	https://github.com/WebAudio/web-audio-api/issues/30
	and always resamples to audio device sample rate
	https://stackoverflow.com/questions/51252732/javascript-getchanneldata-some-out-of-bounds
	Similar project found: 2023-02-11 finds metadata in many formats, to many dependencies for my idea
	https://github.com/Borewit/music-metadata-browser

	History:
		This was one created for the audioMeter (jsGoniometer v2)
		Today it's time to rewrite this code and make it ES6 module
		Now it's located in the not perfect visualizer/analyzer home
		not sure how much time i will invest into reading meta information, there is already such a project
	2023-01-23: Module rewrite, also found that samplerate was not correct and bitrate table was missing complete
	... did the getID3.js
	2023-02-13: webm detection via mime type or byte signature
	https://stackoverflow.com/questions/18299806/how-to-check-file-mime-type-with-javascript-before-upload
	!! https://en.wikipedia.org/wiki/List_of_file_signatures
	https://mimesniff.spec.whatwg.org/#matching-an-image-type-pattern
	
	today 2023-02-19 i found: https://eshaz.github.io/icecast-metadata-js/
	^^ got parser and ice player ! will still continue with my own parser

*/
import {getAsString} from './getAsString.js'
// Containers
import {getRIFF} from './getRIFF.js'
import {getFLAC} from './getFLAC.js'
import {getOGG} from './getOGG.js'
import {getMP4} from './getMP4.js'
import {getEBML} from './getEBML.js'
import {getMP3} from './getMP3.js'
import {getID3} from './getID3.js'

export function getAudioInfo (buf, mimeType) {
	console.time('getAudioInfo')
	const sbuf8 = new Uint8Array(buf)	// ArrayBuffer -> Uint8
	let ret = {
		mime: mimeType,
		tags: {}
	}

	// now i have the mimeType but i keep this and do not use the mimeType
	// identify type by byte signature
	let fType = getAsString(sbuf8, 8)
	if (fType.substring(0, 4) === 'RIFF') {
		ret = {...ret, ...getRIFF(sbuf8)}
	} else if (fType.substring(0, 4) === 'fLaC') {
		ret = {...ret, ...getFLAC(sbuf8)}
	} else if (fType.substring(0, 4) === 'OggS') {
		ret = {...ret, ...getOGG(sbuf8)}
	} else if (sbuf8[0] === 0x1A && sbuf8[1] === 0x45 && sbuf8[2] === 0xDF && sbuf8[3] === 0xA3) {
		ret = {...ret, ...getEBML(sbuf8)}
	} else if (fType.substring(0, 3) === 'ID3'	// MP3 the ones with ID3v2 tag
	|| (sbuf8[0] === 0xFF && (sbuf8[1] === 0xFB || sbuf8[1] === 0xF3 || sbuf8[1] === 0xF2))) {	// without tag or tag at end
		ret = {...ret, ...getMP3(sbuf8)}
	} else if (fType.substring(4, 8) === 'ftyp') {
		ret = {...ret, ...getMP4(sbuf8)}
	} else {
		/*
			AAC (audio/x-m4a)
			
			does not play
			WMP (audio/x-ms-wma)
			AC3 (audio/vnd.dolby.dd-raw)
		*/
		console.error('getAudioInfo found unknown format', getAsString(sbuf8, 256), mimeType)
	}

	ret.tags = {...ret.tags, ...getID3(sbuf8)}	// join in ID3s

	console.timeEnd('getAudioInfo')
	console.log(ret)
	return ret
}