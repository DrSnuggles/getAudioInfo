/*	FLAC
	https://xiph.org/flac/format.html#def_STREAMINFO
	big-endian
*/
import {getVORBIS} from './getVORBIS_COMMENT.js'

const blockTypes = [
	'STREAMINFO',
	'PADDING',
	'APPLICATION',
	'SEEKTABLE',
	'VORBIS_COMMENT',
	'CUESHEET',
	'PICTURE',
]

export function getFLAC(sbuf8) {
	console.time('getFLAC')
	let ret = {
		fType: 'FLAC',
		tags: {},
	}

	let i = 4,
	lastBlock = false
	while (!lastBlock) {
		// METADATA_BLOCK_HEADER
		lastBlock = ((sbuf8[i] & 0b10000000)>>7)
		const blockTypeInt = (sbuf8[i++] & 0b01111111)
		const blockType = blockTypes[ blockTypeInt ]
		const blockLen = (sbuf8[i++]<<16) + (sbuf8[i++]<<8) + (sbuf8[i++])
		console.log('Found BLOCK ', blockType, blockLen, lastBlock)
		if (blockType === 'STREAMINFO') {
			// METADATA_BLOCK_STREAMINFO
			ret.minBlockSize = (sbuf8[i++]<<8) + (sbuf8[i++])
			ret.maxBlockSize = (sbuf8[i++]<<8) + (sbuf8[i++])
			ret.minFrameSize = (sbuf8[i++]<<16) + (sbuf8[i++]<<8) + (sbuf8[i++])
			ret.maxFrameSize = (sbuf8[i++]<<16) + (sbuf8[i++]<<8) + (sbuf8[i++])
			ret.srate = (sbuf8[i++]<<12) + (sbuf8[i++]<<4) + ((sbuf8[i] & 0b11110000)>>4)
			ret.numChannels = ((sbuf8[i] & 0b00001110)>>1) + 1 // add 1 here
			ret.bitsPerSample = ((sbuf8[i++] & 0b00000001)<<4) + ((sbuf8[i] & 0b11110000)>>4) + 1 // add 1 here
			ret.totalSamples = ((sbuf8[i++] & 0b00001111)<<32) + (sbuf8[i++]<<24) + (sbuf8[i++]<<16) + (sbuf8[i++]<<8) + (sbuf8[i++])
			ret.MD5 = (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16) + (sbuf8[i++]).toString(16)
			i -= blockLen // read complete
		} else if (blockType === 'VORBIS_COMMENT') {
			ret.tags.vorbis = getVORBIS( sbuf8.slice(i, i+blockLen) )
		} else {
			console.log('Unknown BLOCK type', blockTypeInt, blockType)
		}
		i += blockLen
	}

	console.timeEnd('getFLAC')
	return ret
}
