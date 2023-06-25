/*	EBML (Extensible Binary Meta Language) Matroska WebM
	https://darkcoding.net/software/reading-mediarecorders-webm-opus-output/
	https://www.matroska.org/technical/elements.html
	https://github.com/ietf-wg-cellar/ebml-specification/blob/master/specification.markdown#vint-examples
	https://github.com/ietf-wg-cellar/ebml-specification/blob/master/specification.markdown#ebml-header-elements
	big-endian
*/

const elements = {
	0x1A45DFA3: 'EBML',
	0x4286: 'EBMLVersion',
	0x42F7: 'EBMLReadVersion',
	0x42F2: 'EBMLMaxIDLength',
	0x42F3: 'EBMLMaxSizeLength',
	0x4282: 'DocType',
	0x4287: 'DocTypeVersion',
	0x4285: 'DocTypeReadVersion',
	0x4281: 'DocTypeExtension',
	0x4283: 'DocTypeExtensionName',
	0x4284: 'DocTypeExtensionVersion',
	0xBF: 'CRC-32',
	0xEC: 'Void',
}

export function getEBML(sbuf8) {
	console.time('getEBML')
	let ret = {
		fType: 'WEBM', // EBML Matroska webm
		tags: {},
	}

	let pointer = 4
	let len = readVINT()
	console.log(len, pointer)


	console.timeEnd('getEBML')
	return ret

	function readVINT() {
		// https://github.com/ietf-wg-cellar/ebml-specification/blob/master/specification.markdown#vint-examples
		const len0 = sbuf8[pointer++]
		if ((len0 & 0b10000000)>>7) return (len0 & 0b01111111)
		const zeroCnt = len0.toString(2).padStart(8,'0').split('1')[0].length
		if (zeroCnt == 1) return ((len0 & 0b00111111)<<8 + sbuf8[pointer++])
		if (zeroCnt == 2) return ((len0 & 0b00011111)<<16 + sbuf8[pointer++]<<8 + sbuf8[pointer++])
		if (zeroCnt == 3) return ((len0 & 0b00001111)<<24 + sbuf8[pointer++]<<16 + sbuf8[pointer++]<<8 + sbuf8[pointer++])
		if (zeroCnt == 4) return ((len0 & 0b00000111)<<32 + sbuf8[pointer++]<<24 + sbuf8[pointer++]<<16 + sbuf8[pointer++]<<8 + sbuf8[pointer++])
		if (zeroCnt == 5) return ((len0 & 0b00000011)<<40 + sbuf8[pointer++]<<32 + sbuf8[pointer++]<<24 + sbuf8[pointer++]<<16 + sbuf8[pointer++]<<8 + sbuf8[pointer++])
		if (zeroCnt == 6) return ((len0 & 0b00000001)<<48 + sbuf8[pointer++]<<40 + sbuf8[pointer++]<<32 + sbuf8[pointer++]<<24 + sbuf8[pointer++]<<16 + sbuf8[pointer++]<<8 + sbuf8[pointer++])
	}
}

