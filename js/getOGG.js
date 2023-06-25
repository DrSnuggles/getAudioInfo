/*
	https://stackoverflow.com/questions/45231773/how-to-get-sample-rate-by-ogg-vorbis-byte-buffer
	https://wiki.xiph.org/Ogg
	https://xiph.org/vorbis/doc/Vorbis_I_spec.pdf
	https://en.wikipedia.org/wiki/Ogg
	https://opus-codec.org/docs/opusfile_api-0.7/structOpusHead.html

	little-endian
*/
import {getAsString} from './getAsString.js'
import {getVORBIS} from './getVORBIS_COMMENT.js'

export function getOGG(sbuf8) {
	console.time('getOGG')
	let ret = {
		fType: 'OGG',
		tags: {},
	}

	let page = readOGGpage(sbuf8, 0, true)
	ret = {...ret, ...page}
	//page = readOGGpage(sbuf8, 0)
	//ret = {...ret, ...page}

	console.timeEnd('getOGG')
	return ret
}

function readOGGpage(sbuf8, i = 0, cont) {
	console.log('readOGGpage', i , cont)
	let page = {},
	ret = {
		tags: [],
	}

	// find next OggS
	while (i < sbuf8.length-4 && getAsString( sbuf8.slice(i, i+4) ) !== 'OggS') i++
	i += 4

	// first ogg page should always have the identification header, then decide how to continue
	page.version = sbuf8[i++] // 0 = mandatory
	page.headerType = sbuf8[i++]
	//page.granulePos = sbuf8[i++] + (sbuf8[i++]<<8) + (sbuf8[i++]<<16) + (sbuf8[i++]<<24) + (sbuf8[i++]<<32)+ (sbuf8[i++]<<40)+ (sbuf8[i++]<<48)+ (sbuf8[i++]<<56)
	page.granulePos = new BigUint64Array( sbuf8.buffer.slice(i, i+8) )[0]
	i += 8
	//page.serial = sbuf8[i++] + (sbuf8[i++]<<8) + (sbuf8[i++]<<16) + (sbuf8[i++]<<24)
	// i could slice out 12 bytes and [2] ? crc32.... speed ;)
	page.serial = new Uint32Array( sbuf8.buffer.slice(i, i+4) )[0]
	i += 4
	//page.pageSeq = sbuf8[i++] + (sbuf8[i++]<<8) + (sbuf8[i++]<<16) + (sbuf8[i++]<<24)
	page.pageSeq = new Uint32Array( sbuf8.buffer.slice(i, i+4) )[0]
	i += 4
	//page.crc32 = sbuf8[i++] + (sbuf8[i++]<<8) + (sbuf8[i++]<<16) + (sbuf8[i++]<<24)
	page.crc32 = new Uint32Array( sbuf8.buffer.slice(i, i+4) )[0]
	i += 4
	const pageSegmentsCnt = sbuf8[i++]
	// read segment table, at first ogg page this is mostly just 1
	const pageSegmentsLen = []
	for (let s = 0; s < pageSegmentsCnt; s++) {
		pageSegmentsLen.push( sbuf8[i++] )
	}
	// read segments
	page.pageSegments = []
	for (let s = 0; s < pageSegmentsCnt; s++) {
		const seg = sbuf8.slice(i, i+pageSegmentsLen[s])
		const idHeader = getAsString( sbuf8.slice(i+1, i+7) ) // vorbis is only 7 long
		// check for common identification headers
		if (idHeader === 'vorbis') {
			console.log('vorbis found', sbuf8[i])
			/*	https://xiph.org/vorbis/doc/Vorbis_I_spec.html
				1st header has to be type 1 = identification
				2nd header has to be type 3 = comment header
				3rd header has to be type 5 = setup header
			*/
			let j = i
			const packetType = sbuf8[j++]
			j += 6
			if (packetType === 1) {
				/*	identification headers
					vorbis_version = read 32 bits as unsigned integer
					audio_channels = read 8 bit integer as unsigned
					audio_sample_rate = read 32 bits as unsigned integer
					bitrate_maximum = read 32 bits as signed integer
					bitrate_nominal = read 32 bits as signed integer
					bitrate_minimum = read 32 bits as signed integer
					blocksize_0 = 2 exponent (read 4 bits as unsigned integer)
					blocksize_1 = 2 exponent (read 4 bits as unsigned integer)
					framing_flag = read one bit
				*/
				const vorbisVersion = sbuf8[j++] + (sbuf8[j++]<<8) + (sbuf8[j++]<<16) + (sbuf8[j++]<<24)
				if (vorbisVersion === 0) {
					ret.numChannels = sbuf8[j++]
					ret.srate = new Uint32Array( sbuf8.buffer.slice(j, j+4) )[0]	// those need the buffer
					j += 4
					ret.maxBitrate = new Int32Array( sbuf8.buffer.slice(j, j+4) )[0]
					j += 4
					ret.bitrate = new Int32Array( sbuf8.buffer.slice(j, j+4) )[0] / 1000
					j += 4
					ret.minBitrate = new Int32Array( sbuf8.buffer.slice(j, j+4) )[0]
					j += 4
					ret.blocksize0 = 2 ** (sbuf8[j] & 0b00001111) // blocksize0 <= blocksize1
					ret.blocksize1 = 2 ** ((sbuf8[j++] & 0b11110000)>>4) // exponent
					ret.framing = (sbuf8[j] & 0b00000001)>>7
				}
			} else if (packetType === 3) {
				//	comment header
				// todo: also read more segments and concat them
				// ^^^simple add all lengths and slice out this large
				let totalBuf = []
				let j = 0
				for (let t = 0; t < pageSegmentsCnt; t++) {
					//console.log(sbuf8[i+j])
					//if (sbuf8[i+j] === 5) break	// thats the next setup header
					let piece = sbuf8.slice(i+j+7, i+j+pageSegmentsLen[t])
					const idx = getAsString(piece).indexOf('vorbis') // mid in segment stream
					if (idx !== -1) {
						piece = piece.slice(0, idx-2)
						totalBuf = [...totalBuf, ...piece ]
						break
					}
					totalBuf = [...totalBuf, ...piece ]
					j += pageSegmentsLen[t] -7
				}
				//console.log( totalBuf )
				//console.log( getAsString( new Uint8Array(totalBuf) ) )
				//console.log( getVORBIS(totalBuf) )
				ret.tags.vorbis = getVORBIS(totalBuf)
				break
			} else {
				// not important header... right now
				break
			}


		} else if (idHeader === 'pusHea') {
			/*	opus
				https://opus-codec.org/docs/opusfile_api-0.7/structOpusHead.html
				little-endian
			*/
			ret.fType = 'OPUS'
			ret.audioFormat = 'OPUS'
			let j = i + 8
			ret.version = sbuf8[j++]
			ret.numChannels = sbuf8[j++]
			ret.preSkip = new Uint16Array( sbuf8.buffer.slice(j, j+2) )[0]
			j += 2
			ret.srate = new Uint16Array( sbuf8.buffer.slice(j, j+2) )[0]	// opus = 48kHz
			j += 2
			ret.outGain = sbuf8[j++]
			ret.mappingFamily = sbuf8[j++]
			ret.streamCount = sbuf8[j++]
			ret.coupledCount = sbuf8[j++]
			ret.mapping = sbuf8[j++]
		} else if (idHeader === 'pusTag') {
			/*	opus
				https://opus-codec.org/docs/opusfile_api-0.7/structOpusTags.html
			*/
			let j = i + 8
			//console.log(getAsString(sbuf8.slice(j, j-8+pageSegmentsLen[s])))
			ret.tags.vorbis = getVORBIS( sbuf8.slice(j, j-8+pageSegmentsLen[s]) ) 
			return ret
		} else if (idHeader === 'pusPic') {
			// https://opus-codec.org/docs/opusfile_api-0.7/structOpusPictureTag.html
			console.log('OpusPictureTag')
			break
		} else {
			console.error('Unknown OGG identification header', idHeader)
		}
		i += pageSegmentsLen[s]
		page.pageSegments.push( seg )
	}

	// read next OGG page
	if (cont) ret = {...ret, ...readOGGpage(sbuf8, i, false)}


	return ret
}