/* new addition, tradionally i was only interested in file sample rate to create same context
dig into ID3v1 ID3v1.1 ID3v2 tags
https://www.datavoyage.com/mpgscript/mpeghdr.htm
https://en.wikipedia.org/wiki/ID3
	ID3v2:		Martin Nilsson
	ID3v2.2:	iTunes specific?
	ID3v2.3:	Most used
	ID3v2.4:	UTF8 + Covers
http://www.unixgods.org/Ruby/ID3/docs/ID3_comparison.html
https://stackoverflow.com/questions/63578757/id3-parser-and-editor
https://stackoverflow.com/questions/60791217/where-is-the-id3v2-documentation/62366354#62366354
*/

export function getID3(ab) {
	console.time('getID3')
	let ret = {
		ID3v1: getID3v1(ab),
		ID3v2: getID3v2(ab),
	}
	//console.log(ret)
	console.timeEnd('getID3')
	return ret
}

//
// ID3v2
//
function getID3v2(ab) {
	// can have multiple v2.3 and 2.4
	// v2.4 was published on November 1, 2000
	// https://web.archive.org/web/20220105180216/https://id3.org/id3v2.3.0
	// https://web.archive.org/web/20200217034456/https://id3.org/id3v2.4.0-structure
	// first look at 10 bytes at start
	let startPos = 0
	let str = getStr(ab, startPos, 10)
	if (str.indexOf('ID3') !== 0) { // not at the start
		//console.log('not found at start')
		// but can also be placed at the end i.e. RIFF_WAVE files in INFO chunk
		str = getStr(ab, ab.length-1024, ab.length-1)
		//let idx = str.indexOf('INFO')
		let idx = str.indexOf('ID3')
		if (idx === -1) return false	// not found at the end, maybe wasnt far enough
		console.log('found at end')
		startPos = ab.length - 1024 + idx
	}
	let ret = {
		version: 'ID3v2.'+ ab[startPos+3] +'.' + ab[startPos+4],
		flags: {
			unsynchronisation: ((ab[startPos+5] & 0b10000000)>>7) !== 0,
			extendedHeader: ((ab[startPos+5] & 0b01000000)>>6) !== 0,
			experimental: ((ab[startPos+5] & 0b00100000)>>5) !== 0,
			footer: ((ab[startPos+5] & 0b00010000)>>4) !== 0,
		},
		size: (ab[startPos+6]<<21) + (ab[startPos+7]<<14) + (ab[startPos+8]<<7) + (ab[startPos+9]),		// big endian 28bits bit7 is ignored, done to prevent sync signal
		frames: [],
	}
	// extendedHeader
	if (ret.flags.extendedHeader) {
		ret.extendedHeader = {
			size: (ab[startPos+10]<<21) + (ab[startPos+11]<<14) + (ab[startPos+12]<<7) + (ab[startPos+13]),
		}
	}
	//console.log( ret)
	// find ID3v2 frames
	// https://docs.mp3tag.de/mapping/
	const knownFrames = {
		3: {	// tagLen = 3 => v2.2.0
			'TT1': 'CONTENTGROUP',
			'TT2': 'TITLE',
			'TT3': 'SUBTITLE',
			'TP1': 'ARTIST',
			'TP1': 'BAND',
			'TP1': 'CONDUCTOR',
			'TP1': 'MIXARTIST',
			'TCM': 'COMPOSER',
			'TXT': 'LYRICIST',
			'TLA': 'LANGUAGE',
			'TCO': 'CONTENTTYPE',
			'TAL': 'ALBUM',
			'TRK': 'TRACKNUM',
			'TPA': 'PARTINSET',
			'TRC': 'ISRC',
			'TDA': 'DATE',
			'TYE': 'YEAR',
			'TIM': 'TIME',
			'TRD': 'RECORDINGDATES',
			'TOR': 'ORIGYEAR',
			'TBP': 'BPM',
			'TMT': 'MEDIATYPE',
			'TFT': 'FILETYPE',
			'TCR': 'COPYRIGHT',
			'TPB': 'PUBLISHER',
			'TEN': 'ENCODEDBY',
			'TSS': 'ENCODERSETTINGS',
			'TLE': 'SONGLEN',
			'TSI': 'SIZE',
			'TDY': 'PLAYLISTDELAY',
			'TKE': 'INITIALKEY',
			'TOT': 'ORIGALBUM',
			'TOF': 'ORIGFILENAME',
			'TOA': 'ORIGARTIST',
			'TOL': 'ORIGLYRICIST',
			'TXX': 'USERTEXT',
			'WAF': 'WWWAUDIOFILE',
			'WAR': 'WWWARTIST',
			'WAS': 'WWWAUDIOSOURCE',
			'WCM': 'WWWCOMMERCIALINFO',
			'WCP': 'WWWCOPYRIGHT',
			'WPB': 'WWWPUBLISHER',
			'WXX': 'WWWUSER',
			'IPL': 'INVOLVEDPEOPLE',
			'ULT': 'UNSYNCEDLYRICS',
			'COM': 'COMMENT',
			'UFI': 'UNIQUEFILEID',
			'MCI': 'CDID',
			'ETC': 'EVENTTIMING',
			'MLL': 'MPEGLOOKUP',
			'STC': 'SYNCEDTEMPO',
			'SLT': 'SYNCEDLYRICS',
			'RVA': 'VOLUMEADJ',
			'EQU': 'EQUALIZATION',
			'REV': 'REVERB',
			'PIC': 'PICTURE',
			'GEO': 'GENERALOBJECT',
			'CNT': 'PLAYCOUNTER',
			'POP': 'POPULARIMETER',
			'BUF': 'BUFFERSIZE',
			'CRM': 'CRYPTEDMETA',
			'CRA': 'AUDIOCRYPTO',
			'LNK': 'LINKEDINFO',
		},
		4: { 	// tagLen = 4 => v2.3.0 + v2.4.0
			'TIT1': 'CONTENTGROUP',
			'TIT2': 'TITLE',
			'TIT3': 'SUBTITLE',
			'TPE1': 'ARTIST',
			'TPE2': 'BAND',
			'TPE3': 'CONDUCTOR',
			'TPE4': 'MIXARTIST',
			'TCOM': 'COMPOSER',
			'TEXT': 'LYRICIST',
			'TLAN': 'LANGUAGE',
			'TCON': 'CONTENTTYPE',
			'TALB': 'ALBUM',
			'TRCK': 'TRACKNUM',
			'TPOS': 'PARTINSET',
			'TSRC': 'ISRC',
			'TDAT': 'DATE',
			'TYER': 'YEAR',
			'TIME': 'TIME',
			'TRDA': 'RECORDINGDATES',
			'TRDC': 'RECORDINGTIME',
			'TORY': 'ORIGYEAR',
			'TDOR': 'ORIGRELEASETIME',
			'TBPM': 'BPM',
			'TMED': 'MEDIATYPE',
			'TFLT': 'FILETYPE',
			'TCOP': 'COPYRIGHT',
			'TPUB': 'PUBLISHER',
			'TENC': 'ENCODEDBY',
			'TSSE': 'ENCODERSETTINGS',
			'TLEN': 'SONGLEN',
			'TSIZ': 'SIZE',
			'TDLY': 'PLAYLISTDELAY',
			'TKEY': 'INITIALKEY',
			'TOAL': 'ORIGALBUM',
			'TOFN': 'ORIGFILENAME',
			'TOPE': 'ORIGARTIST',
			'TOLY': 'ORIGLYRICIST',
			'TSST': 'SETSUBTITLE',
			'TMOO': 'MOOD',
			'TPRO': 'PRODUCEDNOTICE',
			'TDEN': 'ENCODINGTIME',
			'TDRL': 'RELEASETIME',
			'TDTG': 'TAGGINGTIME',
			'TSOA': 'ALBUMSORTORDER',
			'TSOP': 'PERFORMERSORTORDER',
			'TSOT': 'TITLESORTORDER',
			'TXXX': 'USERTEXT',
			'WOAF': 'WWWAUDIOFILE',
			'WOAR': 'WWWARTIST',
			'WOAS': 'WWWAUDIOSOURCE',
			'WCOM': 'WWWCOMMERCIALINFO',
			'WCOP': 'WWWCOPYRIGHT',
			'WPUB': 'WWWPUBLISHER',
			'WORS': 'WWWRADIOPAGE',
			'WPAY': 'WWWPAYMENT',
			'WXXX': 'WWWUSER',
			'IPLS': 'INVOLVEDPEOPLE',
			'TMCL': 'MUSICIANCREDITLIST',
			'TIPL': 'INVOLVEDPEOPLE2',
			'USLT': 'UNSYNCEDLYRICS',
			'COMM': 'COMMENT',
			'USER': 'TERMSOFUSE',
			'UFID': 'UNIQUEFILEID',
			'MCDI': 'CDID',
			'ETCO': 'EVENTTIMING',
			'MLLT': 'MPEGLOOKUP',
			'SYTC': 'SYNCEDTEMPO',
			'SYLT': 'SYNCEDLYRICS',
			'RVAD': 'VOLUMEADJ',
			'RVA2': 'VOLUMEADJ2',
			'EQUA': 'EQUALIZATION',
			'EQU2': 'EQUALIZATION2',
			'RVRB': 'REVERB',
			'APIC': 'PICTURE',
			'GEOB': 'GENERALOBJECT',
			'PCNT': 'PLAYCOUNTER',
			'POPM': 'POPULARIMETER',
			'RBUF': 'BUFFERSIZE',
			'AENC': 'AUDIOCRYPTO',
			'LINK': 'LINKEDINFO',
			'POSS': 'POSITIONSYNC',
			'COMR': 'COMMERCIAL',
			'ENCR': 'CRYPTOREG',
			'GRID': 'GROUPINGREG',
			'PRIV': 'PRIVATE',
			'OWNE': 'OWNERSHIP',
			'SIGN': 'SIGNATURE',
			'SEEK': 'SEEKFRAME',
			'ASPI': 'AUDIOSEEKPOINT',
			'TCMP': 'COMPOSER',
			'GRP1': 'GROUPING',
			'TDRC': 'YEAR',	// DrS: audacity
		}
	}
	const tagLen = (ab[startPos+3] === 2) ? 3 : 4
	str = getStr(ab, startPos, startPos + ret.size)
	//console.log(tagLen, startPos, ret.size, str)
	//console.log(knownFrames[tagLen])
	let i = (ret.extendedHeader) ? 14 + ret.extendedHeader.size : 10
	if (startPos > 100) 		ab = ab.slice(startPos)
	while(i < ret.size-10) {	// todo: respect extendedHeader
		const tag = str.substr(i, tagLen)
		//console.log(tag)
		const thisFrame = {
			size: 1,
		}
		if ( knownFrames[tagLen][tag] ) {
			thisFrame.id = knownFrames[tagLen][tag]
			i += tagLen
			//console.log((ab[i]<<21) , (ab[i+1]<<14) , (ab[i+2]<<7) , (ab[i+3]))
			thisFrame.size = (ab[i]<<21) + (ab[i+1]<<14) + (ab[i+2]<<7) + (ab[i+3])
			i += 4
			thisFrame.flags = {
				tagAlterPreservation: ((ab[i] & 0b10000000)>>7) !== 0,
				fileAlterPreservation: ((ab[i] & 0b01000000)>>6) !== 0,
				readOnly: ((ab[i] & 0b00100000)>>5) !== 0,
				compression: ((ab[i+1] & 0b10000000)>>7) !== 0,
				encryption: ((ab[i+1] & 0b01000000)>>6) !== 0,
				groupingIdentity: ((ab[i+1] & 0b00100000)>>5) !== 0,
			},
			i += 2
			/*
			thisFrame.encoding = [ab[i], ab[i+1], ab[i+2], ab[i+3],
								ab[i+4], ab[i+5], ab[i+6], ab[i+7],
								ab[i+8], ab[i+9], ab[i+10], ab[i+11],
								ab[i+12], ab[i+13], ab[i+14], ab[i+15], 
							]
			*/
			thisFrame.content = decodeStr( new Uint8Array( ab.buffer.slice(i, i + thisFrame.size) ))
			i += thisFrame.size

			if (thisFrame.id === 'COMMENT') {
				thisFrame.content = thisFrame.content.substr(4).replace(/\r/g,'<br/>')
				//thisFrame.contentBegin = [thisFrame.content.charCodeAt(0), thisFrame.content.charCodeAt(1), thisFrame.content.charCodeAt(2), thisFrame.content.charCodeAt(3) ]
			} else if (thisFrame.id === 'PICTURE') {
				const parts = thisFrame.content.split('\x00')
				thisFrame.mime = parts[0]
				const pictureTypes = [
					'Other',
					'32x32 file icon',
					'Other file icon',
					'Cover (front)',
					'Cover (back)',
					'Leaflet page',
					'Media (e.g. lable side of CD)',
					'Lead artist/lead performer/soloist',
					'Artist/performer',
					'Conductor',
					'Band/Orchestra',
					'Composer',
					'Lyricist/text writer',
					'Recording Location',
					'During recording',
					'During performance',
					'Movie/video screen capture',
					'A bright coloured fish',
					'Illustration',
					'Band/artist logotype',
					'Publisher/Studio logotype'
				]
				thisFrame.pictureType = pictureTypes[ parts[1].charCodeAt(0)]
				thisFrame.description = parts[1].substr(1)
				thisFrame.data = parts.slice(2).join('\x00')

			} else if (thisFrame.content === '' || thisFrame.content === '\x00') {
				// empty, do not add
				continue
			} else if (thisFrame.content.substr(0,1) === '\x00') {
				// remove single leading NULL byte
				thisFrame.content = thisFrame.content.substr(1)
			}
			//console.log('Found frame: ',thisFrame)
			ret.frames.push( thisFrame )
		} else {
			console.log('Unknown frame: '+ tag + ' at pos: '+ i +' of '+ ret.size)
			break
			i++
		}
	}
	// padding
	// footer 10 bytes
	return ret
}
function decodeStr(arr) {
	/* first byte of content tells about encoding
	$00	ISO-8859-1 [ISO-8859-1]. Terminated with $00.
	$01	UTF-16 [UTF-16] encoded Unicode [UNICODE] with BOM. All
		strings in the same frame SHALL have the same byteorder.
		Terminated with $00 00.
	$02	UTF-16BE [UTF-16] encoded Unicode [UNICODE] without BOM.
		Terminated with $00 00.
	$03	UTF-8 [UTF-8] encoded Unicode [UNICODE]. Terminated with $00.	https://stackoverflow.com/questions/62334608/textdecoder-prototype-ignorebom-not-working-as-expected
	*/
	const enc = arr[0]
	if (enc === 1) {
		const bom = (arr[1]<<8) + (arr[2])
		if (bom === 0xFFFE) {
			// little endian
			return new TextDecoder('UTF-16LE').decode( arr.slice(3) )
		} else if (bom === 0xFEFF) {
			// big endian
			return new TextDecoder('UTF-16BE').decode( arr.slice(3) )
		} else {
			console.log('Undefined BOM', bom.toString(16) )
		}
	}

	// default
	let start = 1
	if (enc > 3) start = 0 // sometimes encoding is omitted
	return getStr(arr, start, arr.length)//.replace(/\0/g,'')//.trim()
}

//
// ID3v1
//
function getID3v1(ab) {
	let ret = false

	// check ID3v12
	ret = getID3v12(ab)
	// check Enhanced
	if (!ret) ret = getEnhanced(ab)
	// read v11 / v1
	if (!ret) ret = getID3v11(ab)

	return ret
}
const ID3v1Genres = [
	'Blues',
	'Classic rock',
	'Country',
	'Dance',
	'Disco',
	'Funk',
	'Grunge',
	'Hip-Hop',
	'Jazz',
	'Metal',
	'New Age',
	'Oldies',
	'Other',
	'Pop',
	'Rhythm and Blues',
	'Rap',
	'Reggae',
	'Rock',
	'Techno',
	'Industrial',
	'Alternative',
	'Ska',
	'Death metal',
	'Pranks',
	'Soundtrack',
	'Euro-Techno',
	'Ambient',
	'Trip-Hop',
	'Vocal',
	'Jazz & Funk',
	'Fusion',
	'Trance',
	'Classical',
	'Instrumental',
	'Acid',
	'House',
	'Game',
	'Sound clip',
	'Gospel',
	'Noise',
	'Alternative Rock',
	'Bass',
	'Soul',
	'Punk',
	'Space',
	'Meditative',
	'Instrumental Pop',
	'Instrumental rock',
	'Ethnic',
	'Gothic',
	'Darkwave',
	'Techno-Industrial',
	'Electronic',
	'Pop-Folk',
	'Eurodance',
	'Dream',
	'Southern Rock',
	'Comedy',
	'Cult',
	'Gangsta',
	'Top 40',
	'Christian Rap',
	'Pop/Funk',
	'Jungle',
	'Native US',
	'Cabaret',
	'New Wave',
	'Psychedelic',
	'Rave',
	'Show tunes',
	'Trailer',
	'Lo-Fi',
	'Tribal',
	'Acid Punk',
	'Acid Jazz',
	'Polka',
	'Retro',
	'Musical',
	"Rock 'n' Roll",
	'Hard rock',
	// Winamp
	'Folk',
	'Folk-Rock',
	'National Folk',
	'Swing',
	'Fast Fusion',
	'Bebop',
	'Latin',
	'Revival',
	'Celtic',
	'Bluegrass',
	'Avantgarde',
	'Gothic Rock',
	'Progressive Rock',
	'Psychedelic Rock',
	'Symphonic Rock',
	'Slow rock',
	'Big Band',
	'Chorus',
	'Easy Listening',
	'Acoustic',
	'Humour',
	'Speech',
	'Chanson',
	'Opera',
	'Chamber music',
	'Sonata',
	'Symphony',
	'Booty bass',
	'Primus',
	'Porn groove',
	'Satire',
	'Slow jam',
	'Club',
	'Tango',
	'Samba',
	'Folklore',
	'Ballad',
	'Power ballad',
	'Rhythmic Soul',
	'Freestyle',
	'Duet',
	'Punk Rock',
	'Drum solo',
	'A cappella',
	'Euro-House',
	'Dancehall',
	'Goa',
	'Drum & Bass',
	'Club-House',
	'Hardcore Techno',
	'Terror',
	'Indie',
	'BritPop',
	'Negerpunk',
	'Polsk Punk',
	'Beat',
	'Christian Gangsta Rap',
	'Heavy Metal',
	'Black Metal',
	'Crossover',
	'Contemporary Christian',
	'Christian rock',
	'Merengue',
	'Salsa',
	'Thrash Metal',
	'Anime',
	'Jpop',
	'Synthpop',
	'Abstract',
	'Art Rock',
	'Baroque',
	'Bhangra',
	'Big beat',
	'Breakbeat',
	'Chillout',
	'Downtempo',
	'Dub',
	'EBM',
	'Eclectic',
	'Electro',
	'Electroclash',
	'Emo',
	'Experimental',
	'Garage',
	'Global',
	'IDM',
	'Illbient',
	'Industro-Goth',
	'Jam Band',
	'Krautrock',
	'Leftfield',
	'Lounge',
	'Math Rock',
	'New Romantic',
	'Nu-Breakz',
	'Post-Punk',
	'Post-Rock',
	'Psytrance',
	'Shoegaze',
	'Space Rock',
	'Trop Rock',
	'World Music',
	'Neoclassical',
	'Audiobook',
	'Audio theatre',
	'Neue Deutsche Welle',
	'Podcast',
	'Indie-Rock',
	'G-Funk',
	'Dubstep',
	'Garage Rock',
	'Psybient'
]
function getID3v11(ab) {
	/*	ID3v1	1996 Eric Kemp
		ID3v1.1	Michael Mutschler
		this is both v1 and v1.1
	*/
	const str = getStr(ab, ab.length-128, ab.length)

	if (str.indexOf('TAG') !== 0) return false	// no ID3v1 TAG found

	// check ID3v11
	const ret = {
		version: 'ID3v1',
		title: str.substr(3, 30).replace(/\0/g,'').trim(),
		artist: str.substr(33, 30).replace(/\0/g,'').trim(),
		album: str.substr(63, 30).replace(/\0/g,'').trim(),
		year: str.substr(93, 4).replace(/\0/g,'').trim(),
	}
	// Comment / Tracknum
	if (ab[ab.length-3] === 0 && ab[ab.length-2] !== 0) {
		// v11
		ret.version = 'ID3v1.1'
		ret.comment = str.substr(97, 28).replace(/\0/g,'').trim()
		ret.trackNum = ab[ab.length-2]
	} else {
		// v1
		ret.comment = str.substr(97, 30).replace(/\0/g,'').trim()
	}
	// Genre
	if (ab[ab.length-1] < ID3v1Genres.length-1)
		ret.genre = ID3v1Genres[ ab[ab.length-1] ]

	return ret
}
function getEnhanced(ab) {
	/*	The Enhanced tag is 227 bytes long, and placed before the ID3v1 tag.
	header		4		"TAG+"
	title		60		60 characters of the title
	artist		60		60 characters of the artist name
	album		60		60 characters of the album name
	speed		1		0: unset
						1: slow
						2: medium
						3: fast
						4: hardcore
	genre		30		A free-text field for the genre
	start-time	6		the start of the music as mmm:ss
	end-time	6		the end of the music as mmm:ss
	*/
	let ret = false
	const str = getStr(ab, ab.length-128-227, ab.length-227)

	if (str.indexOf('TAG+') !== 0) return false	// not found

	const speed = ['unset','slow','medium','fast','hardcore']
	ret = getID3v11(mp)
	ret.enhanced = true
	ret.title = str.substr(4, 60).replace(/\0/g,'').trim()
	ret.artist = str.substr(64, 60).replace(/\0/g,'').trim()
	ret.album = str.substr(124, 60).replace(/\0/g,'').trim()
	ret.speed = speed[ ab[ab.length-128-227+184] ]
	ret.genre2 = str.substr(185, 30).replace(/\0/g,'').trim()
	ret.startTime = str.substr(215, 6).replace(/\0/g,'').trim()	// mmm:ss
	ret.endTime = str.substr(221, 6).replace(/\0/g,'').trim()	// mmm:ss

	return ret
}
function getID3v12(ab) {
	/*	The ID3v1.2
	http://www.birdcagesoft.com/ID3v12.txt
	EXT ist 128 bytes long, and placed before the ID3v1.1 tag.
	it contains the last part of title, atrist, album, comment
	header		3		"EXT"
	title		30		last part of title
	artist		30		last part of artist
	album		30		last part of album
	comment		15		last part of comment
	genre2		20		free text
	*/
	let ret = false
	const str = getStr(ab, ab.length-256, ab.length-128)

	if (str.indexOf('EXT') !== 0) return false	// not found

	ret = getID3v11(ab)
	ret.version = 'ID3v1.2'
	ret.title += str.substr(3, 30).replace(/\0/g,'').trim()
	ret.artist += str.substr(33, 30).replace(/\0/g,'').trim()
	ret.album += str.substr(63, 30).replace(/\0/g,'').trim()
	ret.comment += str.substr(93, 15).replace(/\0/g,'').trim()
	ret.genre2 = str.substr(108, 20).replace(/\0/g,'').trim()

	return ret
}

//
// Helper
//
function getStr(ab, start, end) {
	// end is not included
	let ret = []
	for (let i = start; i < end; i++) {
	  ret.push( String.fromCharCode( ab[i] ) )
	}
	return ret.join('')
}