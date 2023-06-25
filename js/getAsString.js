export function getAsString(buf, maxSize = 1024*1024) {
	const ret = []
	for (let i = 0, e = Math.min(buf.length, maxSize); i < e; i++) {
		ret.push( String.fromCharCode(buf[i]) )
	}
	return ret.join('')
}
