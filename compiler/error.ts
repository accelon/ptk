export const MAX_VERROR=100;
export enum VError {
	NoKeys        = 'NO_KEYS' ,
	NoKey         = 'NO_KEY' ,
	NotANumber    = 'NOT_NUMBER' ,
	Empty         = 'EMPTY_BUFFER',

	Pattern       = 'PATTERN_MISMATCH' ,
	NotUnique     = 'NOT_UNIQUE',
	Mandatory     = 'MANDANTORY',
	TypeRedef     = 'TYPE_REDEF',
	MissingTypedef= 'MISSING_TYPEDEF',
	UnknownType   = 'UNKNOWN_TYPE',
	ExcessiveField= 'EXCESSIVE_FIELD',

	PtkNamed      = 'PTK_NAMED' ,
	PtkNoName     = 'PTK_NONAME',
	RedefineChunkTag = 'REDEFINE_CHUNK_CHUNK_TAG' ,

}

const VErrorMessage={
	[VError.NoKeys ]       : 'missing keys $1',
	[VError.NoKey  ]       : 'missing key $1 for string',
	[VError.NotANumber]    : 'not a number',
	[VError.Pattern]       : 'pattern mismatch',
	[VError.NotUnique]     : 'not unique',
    [VError.Mandatory]     : 'mandatory field',
    [VError.TypeRedef]     : 'redefine type',
    [VError.MissingTypedef]: 'mssing typedef',
    [VError.ExcessiveField]: 'excessive field',
    [VError.UnknownType]   : 'unknown type',
    [VError.PtkNamed]      : 'ptk already named',
    [VError.PtkNoName]     : 'ptk not named',
    [VError.Empty]         : 'Empty buffer',
}

export const errorMessage=(code : VError , arg)=>{
	return (VErrorMessage[code]||'').replace('$1',arg||'') 
}