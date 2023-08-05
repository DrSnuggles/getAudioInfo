/*
	https://de.wikipedia.org/wiki/RIFF_WAVE
	http://soundfile.sapp.org/doc/WaveFormat/
	The default byte ordering assumed for WAVE data files is little-endian.
	Files written using the big-endian byte ordering scheme have the identifier RIFX instead of RIFF.
*/
import {getAsString} from './getAsString.js'

const dataFormats = {
	0x0001:	'PCM',
	0x0002:	'MS ADPCM',
	0x0003:	'IEEE FLOAT',
	0x0005:	'IBM CVSD',
	0x0006:	'ALAW',
	0x0007:	'MULAW',
	0x0010:	'OKI ADPCM',
	0x0011:	'DVI/IMA ADPCM',
	0x0012:	'MEDIASPACE ADPCM',
	0x0013:	'SIERRA ADPCM',
	0x0014:	'G723 ADPCM',
	0x0015:	'DIGISTD',
	0x0016:	'DIGIFIX',
	0x0017:	'DIALOGIC OKI ADPCM',
	0x0020:	'YAMAHA ADPCM',
	0x0021:	'SONARC',
	0x0022:	'DSPGROUP TRUESPEECH',
	0x0023:	'ECHOSC1',
	0x0024:	'AUDIOFILE AF36',
	0x0025:	'APTX',
	0x0026:	'AUDIOFILE AF10',
	0x0030:	'DOLBY AC2',
	0x0031:	'GSM610',
	0x0033:	'ANTEX ADPCME',
	0x0034:	'CONTROL RES VQLPC',
	0x0035:	'CONTROL RES VQLPC',
	0x0036:	'DIGIADPCM',
	0x0037:	'CONTROL RES CR10',
	0x0038:	'NMS VBXADPCM',
	0x0039:	'CS IMAADPCM (Roland RDAC)',
	0x0040:	'G721 ADPCM',
	0x0050:	'MPEG-1 Layer I, II',
	0x0055:	'MPEG-1 Layer III (MP3)',
	0x0069:	'Xbox ADPCM',
	0x0200:	'CREATIVE ADPCM',
	0x0202:	'CREATIVE FASTSPEECH8',
	0x0203:	'CREATIVE FASTSPEECH10',
	0x0300:	'FM TOWNS SND',
	0x1000:	'OLIGSM',
	0x1001:	'OLIADPCM',
	0x1002:	'OLICELP',
	0x1003:	'OLISBC',
	0x1004:	'OLIOPR',
}

const infoTags = {
	// https://www.recordingblogs.com/wiki/list-chunk-of-a-wave-file
	'IARL': 'Archive location', // The location where the subject of the file is archived
	'IART': 'Original artist', // The artist of the original subject of the file
	'ICMS': 'Commissioner', // The name of the person or organization that commissioned the original subject of the file
	'ICMT': 'Comment', // General comments about the file or its subject
	'ICOP': 'Copyright', // Copyright information about the file (e.g., "Copyright Some Company 2011")
	'ICRD': 'Creation date', // The date the subject of the file was created (creation date) (e.g., "2022-12-31")
	'ICRP': 'Cropped', // Whether and how an image was cropped
	'IDIM': 'Dimensions', // The dimensions of the original subject of the file
	'IDPI': 'DPI', // Dots per inch settings used to digitize the file
	'IENG': 'Engineer', // The name of the engineer who worked on the file
	'IGNR': 'Genre', // The genre of the subject
	'IKEY': 'Keywords', // A list of keywords for the file or its subject
	'ILGT': 'Lightness', // Lightness settings used to digitize the file
	'IMED': 'Medium', // Medium for the original subject of the file
	'INAM': 'Name', // Title of the subject of the file (name)
	'IPLT': 'Colors', // The number of colors in the color palette used to digitize the file
	'IPRD': 'Album', // Name of the title the subject was originally intended for
	'ISBJ': 'Subject', // Description of the contents of the file (subject)
	'ISFT': 'Software', // Name of the software package used to create the file
	'ISRC': 'Supplier', // The name of the person or organization that supplied the original subject of the file
	'ISRF': 'Source', // The original form of the material that was digitized (source form)
	'ITCH': 'Technician', // The name of the technician who digitized the subject file
	'ITRK': 'TrackNum', // DrS: audacity wrote this
	'id3 ': 'id3 ', // DrS: the whole ID3 block
}

export function getRIFF(sbuf8) {
	console.time('getRIFF')
	let ret = {
		tags: {},
	}

	// look for 'fmt '
	const fmtStart = 12 // getAsString(sbuf8).indexOf('fmt ') // 12 normally
	const knownChunks = ['fmt ','data','LIST']
	const chunks = []
	let i = 12 // before its RIFFsizeWAVE
	while (i < sbuf8.length-4) {
		let chkName = getAsString(sbuf8.slice(i, i+4)) // quick, just 4 bytes
		if (knownChunks.indexOf(chkName) === -1) {
			// unknown
			i++
			continue
		}
		// found a chunk
		let chunk = {
			id: chkName,
			size: (sbuf8[i+4]) + (sbuf8[i+5]<<8) + (sbuf8[i+6]<<16) + (sbuf8[i+7]<<24),
			pos: i,
		}
		console.log('chunk.size', chunk.size)
		i += 8
		if (chunk.id === 'LIST') {
			// LIST chunk can have INFO or adtl
			chkName = getAsString(sbuf8.slice(i, i+4)) // quick, just 4 bytes
			if (chkName === 'INFO') {
				ret.tags.container = []
				i += 4
				//console.log('INFO', i, chunk.size)
				while (i < i + chunk.size) {
					const tagName = getAsString(sbuf8.slice(i, i+4)) // quick, just 4 bytes
					const entryLen = (sbuf8[i+4]) + (sbuf8[i+5]<<8) + (sbuf8[i+6]<<16) + (sbuf8[i+7]<<24)
					const key = infoTags[tagName]
					if (!key) break
					//console.log('entryLen', entryLen, tagName, key)
					i += 8
					ret.tags.container.push( {id: key, content: getAsString(sbuf8.slice(i, i+entryLen)).replace(/\0/g,'').trim()} )
					i += entryLen
				}

			}
		}
		chunks.push(chunk)
		i += chunk.size
	}
	console.log(chunks)

	ret = {...ret, ...{
		fType: 'WAV',
		//chunkSize: (sbuf8[4]) + (sbuf8[5]<<8) + (sbuf8[6]<<16) + (sbuf8[7]<<24),
		//audioFormat: (sbuf8[fmtStart+8]) + (sbuf8[fmtStart+9]<<8), // 1 = PCM uncompressed (i.e. Linear quantization)
		audioFormat: dataFormats[(sbuf8[fmtStart+8]) + (sbuf8[fmtStart+9]<<8)],
		numChannels: (sbuf8[fmtStart+10]) + (sbuf8[fmtStart+11]<<8),
		srate: (sbuf8[fmtStart+12]) + (sbuf8[fmtStart+13]<<8) + (sbuf8[fmtStart+14]<<16) + (sbuf8[fmtStart+15]<<24),
		//byteRate: (sbuf8[fmtStart+16]) + (sbuf8[fmtStart+17]<<8) + (sbuf8[fmtStart+18]<<16) + (sbuf8[fmtStart+19]<<24), // == SampleRate * NumChannels * BitsPerSample/8
		//blockAlign: (sbuf8[fmtStart+20]) + (sbuf8[fmtStart+21]<<8),	// == NumChannels * BitsPerSample/8
		bitsPerSample: (sbuf8[fmtStart+22]) + (sbuf8[fmtStart+23]<<8),
	}}
	console.timeEnd('getRIFF')
	//console.log(ret)
	return ret
}
