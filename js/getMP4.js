/*	This is more a video container
	http://xhelmboyx.tripod.com/formats/mp4-layout.txt
	big endian
*/
import {getAsString} from './getAsString.js'

export function getMP4(sbuf8) {
    console.time('getMP4')
    let ret = {}
	const str = getAsString(sbuf8)
	const mdhdStart = str.indexOf('mdhd')
	const version = sbuf8[mdhdStart+4]

	ret = {...ret, ...{
		fType: 'MP4',
        subtype: str.substring(8, 12),   // "avc1", "iso2", "isom", "mmp4", "mp41", "mp42", "mp71", "msnv", "ndas", "ndsc", "ndsh", "ndsm", "ndsp", "ndss", "ndxc", "ndxh", "ndxm", "ndxp", "ndxs"
		version: version,
        numChannels: 2, // todo
        // todo: srate = 90kHz for audio ??? nope this is not true have to find proper aac container first
		srate: (version === 1) ? (sbuf8[mdhdStart+16+8]<<24) + (sbuf8[mdhdStart+17+8]<<16) + (sbuf8[mdhdStart+18+8]<<8) + sbuf8[mdhdStart+19+8] : (sbuf8[mdhdStart+16]<<24) + (sbuf8[mdhdStart+17]<<16) + (sbuf8[mdhdStart+18]<<8) + sbuf8[mdhdStart+19],
	}}
	console.timeEnd('getMP4')
	//console.log(ret)
	return ret
}




