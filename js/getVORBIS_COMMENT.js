/*
	VORBIS_COMMENT
	https://www.xiph.org/vorbis/doc/v-comment.html
	data looks like little-endian
*/
import {getAsString} from './getAsString.js'

export function getVORBIS(sbuf8) {
	console.time('getVORBIS')
	let ret = []

	let i = 0
	while (i < sbuf8.length) {
		const vendorLength = sbuf8[i++] + (sbuf8[i++]<<8) + (sbuf8[i++]<<16) + (sbuf8[i++]<<24)
		const vendorString = getAsString(sbuf8.slice(i, i+vendorLength))
		i += vendorLength
		ret.push( {vendorString: vendorString} )
		const userCommentListLength = sbuf8[i++] + (sbuf8[i++]<<8) + (sbuf8[i++]<<16) + (sbuf8[i++]<<24)
		let k = 0
		while (k < userCommentListLength) {
			// user comments
			const commentLength = sbuf8[i++] + (sbuf8[i++]<<8) + (sbuf8[i++]<<16) + (sbuf8[i++]<<24)
			let commentString
			try {
				commentString = new TextDecoder('UTF-8').decode( sbuf8.slice(i, i+commentLength) )//getAsString(sbuf8.slice(i, i+commentLength))
			}catch(e){
				commentString = getAsString(sbuf8.slice(i, i+commentLength))
			}
			i += commentLength
			//console.log('commentString', commentLength, commentString)
			// split
			let comm = commentString.split('=')
			ret.push( {id:comm[0], content:comm[1]} )
			k++
		}
		const framingBit = (sbuf8[i] & 0b00000001) // which bit is it ??? the first i guess coz streaming
		console.log('framingBit', framingBit)
	}

	console.timeEnd('getVORBIS')
	return ret
}