export function getMP3(sbuf8) {
	// MP3_readFrameHeaders
	// read samplerate from frame: https://de.wikipedia.org/wiki/MP3#Frame-Header
	// https://www.mp3-tech.org/programmer/frame_header.html
	// first we need to know ID = MPEG version (2 bits)
	// then we another 2bits (sample rate freq index) and we can look in table which samplerate was used
	/*
	Sampling rate frequency index
	bits	MPEG1     MPEG2	     MPEG2.5
	00    44100 Hz  22050 Hz	 11025 Hz
	01	  48000 Hz	24000 Hz	 12000 Hz
	10	  32000 Hz	16000 Hz	  8000 Hz
	11	  reserv.	  reserv.	   reserv.
	*/
	const info = {
		bitrate: -1,
	}
	let gapSize = 0
	// search for frame header which is identified by Sync = 1111 1111 111
	//for (let i = 0; i < sbuf8.length-1; i++) { // before it's not our header
	//for (let i = Math.floor(sbuf8.length/32); i < sbuf8.length/16; i++) {
	for (let i = 0; i < sbuf8.length; i++) {	// if not working as expected make it larger
	//for (let i = 0; i < sbuf8.length; i++) {	// if not working as expected make it larger
	// todo: check TiLT - Odyssey Part 1
		if (sbuf8[i] === 0xFF && (sbuf8[i+1] & 0b11100000) === 0xE0) {
			const ID = ((sbuf8[i+1] & 0b00011000)>>3)
			const Layer = ((sbuf8[i+1] & 0b00000110)>>1)
			const bitrate = ((sbuf8[i+2] & 0b11110000)>>4) // table lookup
			const srate = ((sbuf8[i+2] & 0b00001100)>>2) // table lookup
			const numChannels = ((sbuf8[i+3] & 0b11000000)>>6) // table lookup
			//break // stop after first hit
			// ^^^no ! need to know other frames as well since it can and will change (VBR for example)
			const checkFtype = MP3_translate_ID(ID) +" "+ MP3_translate_Layer(Layer)
			if (checkFtype.indexOf('reserved') !== -1) continue
			const checkBitrate = MP3_translate_bitrate(bitrate, (ID & 0b00000001 !== 1) ? 2 : 1, (checkFtype.match(/I/g) || []).length)
			if (checkBitrate === 'bad') continue
			const checkSrate = MP3_translate_srate(srate, ID)
			if (checkSrate === 'not allowed' || checkSrate === 'reserved') continue

			// calc jump size
			const padding = ((sbuf8[i+2] & 0b00000010)>>1)
			let FrameLengthInBytes
			if ((checkFtype.match(/I/g) || []).length === 1) {
				FrameLengthInBytes = (12 * checkBitrate*1000 / checkSrate + padding) * 4
			} else {
				FrameLengthInBytes = 144 * checkBitrate*1000 / checkSrate + padding
			}
			FrameLengthInBytes = Math.floor(FrameLengthInBytes)

			//console.log(gapSize, (checkFtype.match(/I/g) || []).length, checkBitrate, checkSrate, padding, FrameLengthInBytes)
			if (gapSize === 1) {
				//console.log('found frame header sync @'+ i)
				//console.log('AAAAAAAA AAABBCCD EEEEFFGH IIJJKLMM')
				//console.log(sbuf8[i].toString(2).padStart(8, 0), sbuf8[i+1].toString(2).padStart(8, 0), sbuf8[i+2].toString(2).padStart(8, 0), sbuf8[i+3].toString(2).padStart(8, 0))
				info.fType = checkFtype
				info.bitrate = (info.bitrate === -1) ? checkBitrate : Math.round((info.bitrate+checkBitrate)/2) // calc avg
				info.srate = checkSrate
				info.numChannels = MP3_translate_numChannels(numChannels)
				//console.log( JSON.stringify(info) )
			}
	
			//info.FrameLengthInBytes = FrameLengthInBytes
			i += FrameLengthInBytes -1

			gapSize = 0
		}
		gapSize++
	}
	return info
}
function MP3_translate_ID(i) {
	return ['MPEG Version 2.5', 'reserved', 'MPEG Version 2', 'MPEG Version 1'][i]
}
function MP3_translate_Layer(i) {
	return ['reserved', 'Layer III', 'Layer II', 'Layer I'][i]
}
function MP3_translate_numChannels(i) {
	return ['Stereo', 'Joint Stereo', '2 Mono', 'Mono'][i]
}
function MP3_translate_srate(i, ID) {
	const div = [3, 0, 2, 1][ID]
	if (div == 0) return 'not allowed'
	return [44100/div, 48000/div, 32000/div, 'reserved'][i]
}
function MP3_translate_bitrate(bits, version, layer) {
//	console.log(bits, version, layer)
	const ret = {
		0: {
			1: {
				1: 'free',
				2: 'free',
				3: 'free',
			},
			2: {
				1: 'free',
				2: 'free',
				3: 'free',
			},
		},
		1: {
			1: {
				1: 32,
				2: 32,
				3: 32,
			},
			2: {
				1: 32,
				2: 8,
				3: 8,
			},
		},
		2: {
			1: {
				1: 64,
				2: 48,
				3: 40,
			},
			2: {
				1: 48,
				2: 16,
				3: 16,
			},
		},
		3: {
			1: {
				1: 96,
				2: 56,
				3: 48,
			},
			2: {
				1: 56,
				2: 24,
				3: 24,
			},
		},
		4: {
			1: {
				1: 128,
				2: 64,
				3: 56,
			},
			2: {
				1: 64,
				2: 32,
				3: 32,
			},
		},
		5: {
			1: {
				1: 160,
				2: 80,
				3: 64,
			},
			2: {
				1: 80,
				2: 40,
				3: 40,
			},
		},
		6: {
			1: {
				1: 192,
				2: 96,
				3: 80,
			},
			2: {
				1: 96,
				2: 48,
				3: 48,
			},
		},
		7: {
			1: {
				1: 224,
				2: 112,
				3: 96,
			},
			2: {
				1: 112,
				2: 56,
				3: 56,
			},
		},
		8: {
			1: {
				1: 256,
				2: 128,
				3: 112,
			},
			2: {
				1: 128,
				2: 64,
				3: 64,
			},
		},
		9: {
			1: {
				1: 288,
				2: 160,
				3: 128,
			},
			2: {
				1: 144,
				2: 80,
				3: 80,
			},
		},
		10: {
			1: {
				1: 320,
				2: 192,
				3: 160,
			},
			2: {
				1: 160,
				2: 96,
				3: 96,
			},
		},
		11: {
			1: {
				1: 352,
				2: 224,
				3: 192,
			},
			2: {
				1: 176,
				2: 112,
				3: 112,
			},
		},
		12: {
			1: {
				1: 384,
				2: 256,
				3: 224,
			},
			2: {
				1: 192,
				2: 128,
				3: 128,
			},
		},
		13: {
			1: {
				1: 416,
				2: 320,
				3: 256,
			},
			2: {
				1: 224,
				2: 144,
				3: 144,
			},
		},
		14: {
			1: {
				1: 448,
				2: 384,
				3: 320,
			},
			2: {
				1: 256,
				2: 160,
				3: 160,
			},
		},
		15: {
			1: {
				1: 'bad',
				2: 'bad',
				3: 'bad',
			},
			2: {
				1: 'bad',
				2: 'bad',
				3: 'bad',
			},
		},
	}
	return ret[bits][version][layer]
}
