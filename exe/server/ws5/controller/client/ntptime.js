var util 		= require('util');
var ControllerHelper = require('./controllerhelper');
var ControllerCmd 	= require('./command');
var controllerCmd 	= new ControllerCmd();

var helper 		= new ControllerHelper();
var logger 		= helper.logger;

function NTPTime() {
	logger 			= helper.logger;
	
	var msToNTPArray = [
		0x00000000, 0x00418937, 0x0083126f, 0x00c49ba6, 0x010624dd, 0x0147ae14,
		0x0189374c, 0x01cac083, 0x020c49ba, 0x024dd2f2, 0x028f5c29, 0x02d0e560,
		0x03126e98, 0x0353f7cf, 0x03958106, 0x03d70a3d, 0x04189375, 0x045a1cac,
		0x049ba5e3, 0x04dd2f1b, 0x051eb852, 0x05604189, 0x05a1cac1, 0x05e353f8,
		0x0624dd2f, 0x06666666, 0x06a7ef9e, 0x06e978d5, 0x072b020c, 0x076c8b44,
		0x07ae147b, 0x07ef9db2, 0x083126e9, 0x0872b021, 0x08b43958, 0x08f5c28f,
		0x09374bc7, 0x0978d4fe, 0x09ba5e35, 0x09fbe76d, 0x0a3d70a4, 0x0a7ef9db,
		0x0ac08312, 0x0b020c4a, 0x0b439581, 0x0b851eb8, 0x0bc6a7f0, 0x0c083127,
		0x0c49ba5e, 0x0c8b4396, 0x0ccccccd, 0x0d0e5604, 0x0d4fdf3b, 0x0d916873,
		0x0dd2f1aa, 0x0e147ae1, 0x0e560419, 0x0e978d50, 0x0ed91687, 0x0f1a9fbe,
		0x0f5c28f6, 0x0f9db22d, 0x0fdf3b64, 0x1020c49c, 0x10624dd3, 0x10a3d70a,
		0x10e56042, 0x1126e979, 0x116872b0, 0x11a9fbe7, 0x11eb851f, 0x122d0e56,
		0x126e978d, 0x12b020c5, 0x12f1a9fc, 0x13333333, 0x1374bc6a, 0x13b645a2,
		0x13f7ced9, 0x14395810, 0x147ae148, 0x14bc6a7f, 0x14fdf3b6, 0x153f7cee,
		0x15810625, 0x15c28f5c, 0x16041893, 0x1645a1cb, 0x16872b02, 0x16c8b439,
		0x170a3d71, 0x174bc6a8, 0x178d4fdf, 0x17ced917, 0x1810624e, 0x1851eb85,
		0x189374bc, 0x18d4fdf4, 0x1916872b, 0x19581062, 0x1999999a, 0x19db22d1,
		0x1a1cac08, 0x1a5e353f, 0x1a9fbe77, 0x1ae147ae, 0x1b22d0e5, 0x1b645a1d,
		0x1ba5e354, 0x1be76c8b, 0x1c28f5c3, 0x1c6a7efa, 0x1cac0831, 0x1ced9168,
		0x1d2f1aa0, 0x1d70a3d7, 0x1db22d0e, 0x1df3b646, 0x1e353f7d, 0x1e76c8b4,
		0x1eb851ec, 0x1ef9db23, 0x1f3b645a, 0x1f7ced91, 0x1fbe76c9, 0x20000000,
		0x20418937, 0x2083126f, 0x20c49ba6, 0x210624dd, 0x2147ae14, 0x2189374c,
		0x21cac083, 0x220c49ba, 0x224dd2f2, 0x228f5c29, 0x22d0e560, 0x23126e98,
		0x2353f7cf, 0x23958106, 0x23d70a3d, 0x24189375, 0x245a1cac, 0x249ba5e3,
		0x24dd2f1b, 0x251eb852, 0x25604189, 0x25a1cac1, 0x25e353f8, 0x2624dd2f,
		0x26666666, 0x26a7ef9e, 0x26e978d5, 0x272b020c, 0x276c8b44, 0x27ae147b,
		0x27ef9db2, 0x283126e9, 0x2872b021, 0x28b43958, 0x28f5c28f, 0x29374bc7,
		0x2978d4fe, 0x29ba5e35, 0x29fbe76d, 0x2a3d70a4, 0x2a7ef9db, 0x2ac08312,
		0x2b020c4a, 0x2b439581, 0x2b851eb8, 0x2bc6a7f0, 0x2c083127, 0x2c49ba5e,
		0x2c8b4396, 0x2ccccccd, 0x2d0e5604, 0x2d4fdf3b, 0x2d916873, 0x2dd2f1aa,
		0x2e147ae1, 0x2e560419, 0x2e978d50, 0x2ed91687, 0x2f1a9fbe, 0x2f5c28f6,
		0x2f9db22d, 0x2fdf3b64, 0x3020c49c, 0x30624dd3, 0x30a3d70a, 0x30e56042,
		0x3126e979, 0x316872b0, 0x31a9fbe7, 0x31eb851f, 0x322d0e56, 0x326e978d,
		0x32b020c5, 0x32f1a9fc, 0x33333333, 0x3374bc6a, 0x33b645a2, 0x33f7ced9,
		0x34395810, 0x347ae148, 0x34bc6a7f, 0x34fdf3b6, 0x353f7cee, 0x35810625,
		0x35c28f5c, 0x36041893, 0x3645a1cb, 0x36872b02, 0x36c8b439, 0x370a3d71,
		0x374bc6a8, 0x378d4fdf, 0x37ced917, 0x3810624e, 0x3851eb85, 0x389374bc,
		0x38d4fdf4, 0x3916872b, 0x39581062, 0x3999999a, 0x39db22d1, 0x3a1cac08,
		0x3a5e353f, 0x3a9fbe77, 0x3ae147ae, 0x3b22d0e5, 0x3b645a1d, 0x3ba5e354,
		0x3be76c8b, 0x3c28f5c3, 0x3c6a7efa, 0x3cac0831, 0x3ced9168, 0x3d2f1aa0,
		0x3d70a3d7, 0x3db22d0e, 0x3df3b646, 0x3e353f7d, 0x3e76c8b4, 0x3eb851ec,
		0x3ef9db23, 0x3f3b645a, 0x3f7ced91, 0x3fbe76c9, 0x40000000, 0x40418937,
		0x4083126f, 0x40c49ba6, 0x410624dd, 0x4147ae14, 0x4189374c, 0x41cac083,
		0x420c49ba, 0x424dd2f2, 0x428f5c29, 0x42d0e560, 0x43126e98, 0x4353f7cf,
		0x43958106, 0x43d70a3d, 0x44189375, 0x445a1cac, 0x449ba5e3, 0x44dd2f1b,
		0x451eb852, 0x45604189, 0x45a1cac1, 0x45e353f8, 0x4624dd2f, 0x46666666,
		0x46a7ef9e, 0x46e978d5, 0x472b020c, 0x476c8b44, 0x47ae147b, 0x47ef9db2,
		0x483126e9, 0x4872b021, 0x48b43958, 0x48f5c28f, 0x49374bc7, 0x4978d4fe,
		0x49ba5e35, 0x49fbe76d, 0x4a3d70a4, 0x4a7ef9db, 0x4ac08312, 0x4b020c4a,
		0x4b439581, 0x4b851eb8, 0x4bc6a7f0, 0x4c083127, 0x4c49ba5e, 0x4c8b4396,
		0x4ccccccd, 0x4d0e5604, 0x4d4fdf3b, 0x4d916873, 0x4dd2f1aa, 0x4e147ae1,
		0x4e560419, 0x4e978d50, 0x4ed91687, 0x4f1a9fbe, 0x4f5c28f6, 0x4f9db22d,
		0x4fdf3b64, 0x5020c49c, 0x50624dd3, 0x50a3d70a, 0x50e56042, 0x5126e979,
		0x516872b0, 0x51a9fbe7, 0x51eb851f, 0x522d0e56, 0x526e978d, 0x52b020c5,
		0x52f1a9fc, 0x53333333, 0x5374bc6a, 0x53b645a2, 0x53f7ced9, 0x54395810,
		0x547ae148, 0x54bc6a7f, 0x54fdf3b6, 0x553f7cee, 0x55810625, 0x55c28f5c,
		0x56041893, 0x5645a1cb, 0x56872b02, 0x56c8b439, 0x570a3d71, 0x574bc6a8,
		0x578d4fdf, 0x57ced917, 0x5810624e, 0x5851eb85, 0x589374bc, 0x58d4fdf4,
		0x5916872b, 0x59581062, 0x5999999a, 0x59db22d1, 0x5a1cac08, 0x5a5e353f,
		0x5a9fbe77, 0x5ae147ae, 0x5b22d0e5, 0x5b645a1d, 0x5ba5e354, 0x5be76c8b,
		0x5c28f5c3, 0x5c6a7efa, 0x5cac0831, 0x5ced9168, 0x5d2f1aa0, 0x5d70a3d7,
		0x5db22d0e, 0x5df3b646, 0x5e353f7d, 0x5e76c8b4, 0x5eb851ec, 0x5ef9db23,
		0x5f3b645a, 0x5f7ced91, 0x5fbe76c9, 0x60000000, 0x60418937, 0x6083126f,
		0x60c49ba6, 0x610624dd, 0x6147ae14, 0x6189374c, 0x61cac083, 0x620c49ba,
		0x624dd2f2, 0x628f5c29, 0x62d0e560, 0x63126e98, 0x6353f7cf, 0x63958106,
		0x63d70a3d, 0x64189375, 0x645a1cac, 0x649ba5e3, 0x64dd2f1b, 0x651eb852,
		0x65604189, 0x65a1cac1, 0x65e353f8, 0x6624dd2f, 0x66666666, 0x66a7ef9e,
		0x66e978d5, 0x672b020c, 0x676c8b44, 0x67ae147b, 0x67ef9db2, 0x683126e9,
		0x6872b021, 0x68b43958, 0x68f5c28f, 0x69374bc7, 0x6978d4fe, 0x69ba5e35,
		0x69fbe76d, 0x6a3d70a4, 0x6a7ef9db, 0x6ac08312, 0x6b020c4a, 0x6b439581,
		0x6b851eb8, 0x6bc6a7f0, 0x6c083127, 0x6c49ba5e, 0x6c8b4396, 0x6ccccccd,
		0x6d0e5604, 0x6d4fdf3b, 0x6d916873, 0x6dd2f1aa, 0x6e147ae1, 0x6e560419,
		0x6e978d50, 0x6ed91687, 0x6f1a9fbe, 0x6f5c28f6, 0x6f9db22d, 0x6fdf3b64,
		0x7020c49c, 0x70624dd3, 0x70a3d70a, 0x70e56042, 0x7126e979, 0x716872b0,
		0x71a9fbe7, 0x71eb851f, 0x722d0e56, 0x726e978d, 0x72b020c5, 0x72f1a9fc,
		0x73333333, 0x7374bc6a, 0x73b645a2, 0x73f7ced9, 0x74395810, 0x747ae148,
		0x74bc6a7f, 0x74fdf3b6, 0x753f7cee, 0x75810625, 0x75c28f5c, 0x76041893,
		0x7645a1cb, 0x76872b02, 0x76c8b439, 0x770a3d71, 0x774bc6a8, 0x778d4fdf,
		0x77ced917, 0x7810624e, 0x7851eb85, 0x789374bc, 0x78d4fdf4, 0x7916872b,
		0x79581062, 0x7999999a, 0x79db22d1, 0x7a1cac08, 0x7a5e353f, 0x7a9fbe77,
		0x7ae147ae, 0x7b22d0e5, 0x7b645a1d, 0x7ba5e354, 0x7be76c8b, 0x7c28f5c3,
		0x7c6a7efa, 0x7cac0831, 0x7ced9168, 0x7d2f1aa0, 0x7d70a3d7, 0x7db22d0e,
		0x7df3b646, 0x7e353f7d, 0x7e76c8b4, 0x7eb851ec, 0x7ef9db23, 0x7f3b645a,
		0x7f7ced91, 0x7fbe76c9, 0x80000000, 0x80418937, 0x8083126f, 0x80c49ba6,
		0x810624dd, 0x8147ae14, 0x8189374c, 0x81cac083, 0x820c49ba, 0x824dd2f2,
		0x828f5c29, 0x82d0e560, 0x83126e98, 0x8353f7cf, 0x83958106, 0x83d70a3d,
		0x84189375, 0x845a1cac, 0x849ba5e3, 0x84dd2f1b, 0x851eb852, 0x85604189,
		0x85a1cac1, 0x85e353f8, 0x8624dd2f, 0x86666666, 0x86a7ef9e, 0x86e978d5,
		0x872b020c, 0x876c8b44, 0x87ae147b, 0x87ef9db2, 0x883126e9, 0x8872b021,
		0x88b43958, 0x88f5c28f, 0x89374bc7, 0x8978d4fe, 0x89ba5e35, 0x89fbe76d,
		0x8a3d70a4, 0x8a7ef9db, 0x8ac08312, 0x8b020c4a, 0x8b439581, 0x8b851eb8,
		0x8bc6a7f0, 0x8c083127, 0x8c49ba5e, 0x8c8b4396, 0x8ccccccd, 0x8d0e5604,
		0x8d4fdf3b, 0x8d916873, 0x8dd2f1aa, 0x8e147ae1, 0x8e560419, 0x8e978d50,
		0x8ed91687, 0x8f1a9fbe, 0x8f5c28f6, 0x8f9db22d, 0x8fdf3b64, 0x9020c49c,
		0x90624dd3, 0x90a3d70a, 0x90e56042, 0x9126e979, 0x916872b0, 0x91a9fbe7,
		0x91eb851f, 0x922d0e56, 0x926e978d, 0x92b020c5, 0x92f1a9fc, 0x93333333,
		0x9374bc6a, 0x93b645a2, 0x93f7ced9, 0x94395810, 0x947ae148, 0x94bc6a7f,
		0x94fdf3b6, 0x953f7cee, 0x95810625, 0x95c28f5c, 0x96041893, 0x9645a1cb,
		0x96872b02, 0x96c8b439, 0x970a3d71, 0x974bc6a8, 0x978d4fdf, 0x97ced917,
		0x9810624e, 0x9851eb85, 0x989374bc, 0x98d4fdf4, 0x9916872b, 0x99581062,
		0x9999999a, 0x99db22d1, 0x9a1cac08, 0x9a5e353f, 0x9a9fbe77, 0x9ae147ae,
		0x9b22d0e5, 0x9b645a1d, 0x9ba5e354, 0x9be76c8b, 0x9c28f5c3, 0x9c6a7efa,
		0x9cac0831, 0x9ced9168, 0x9d2f1aa0, 0x9d70a3d7, 0x9db22d0e, 0x9df3b646,
		0x9e353f7d, 0x9e76c8b4, 0x9eb851ec, 0x9ef9db23, 0x9f3b645a, 0x9f7ced91,
		0x9fbe76c9, 0xa0000000, 0xa0418937, 0xa083126f, 0xa0c49ba6, 0xa10624dd,
		0xa147ae14, 0xa189374c, 0xa1cac083, 0xa20c49ba, 0xa24dd2f2, 0xa28f5c29,
		0xa2d0e560, 0xa3126e98, 0xa353f7cf, 0xa3958106, 0xa3d70a3d, 0xa4189375,
		0xa45a1cac, 0xa49ba5e3, 0xa4dd2f1b, 0xa51eb852, 0xa5604189, 0xa5a1cac1,
		0xa5e353f8, 0xa624dd2f, 0xa6666666, 0xa6a7ef9e, 0xa6e978d5, 0xa72b020c,
		0xa76c8b44, 0xa7ae147b, 0xa7ef9db2, 0xa83126e9, 0xa872b021, 0xa8b43958,
		0xa8f5c28f, 0xa9374bc7, 0xa978d4fe, 0xa9ba5e35, 0xa9fbe76d, 0xaa3d70a4,
		0xaa7ef9db, 0xaac08312, 0xab020c4a, 0xab439581, 0xab851eb8, 0xabc6a7f0,
		0xac083127, 0xac49ba5e, 0xac8b4396, 0xaccccccd, 0xad0e5604, 0xad4fdf3b,
		0xad916873, 0xadd2f1aa, 0xae147ae1, 0xae560419, 0xae978d50, 0xaed91687,
		0xaf1a9fbe, 0xaf5c28f6, 0xaf9db22d, 0xafdf3b64, 0xb020c49c, 0xb0624dd3,
		0xb0a3d70a, 0xb0e56042, 0xb126e979, 0xb16872b0, 0xb1a9fbe7, 0xb1eb851f,
		0xb22d0e56, 0xb26e978d, 0xb2b020c5, 0xb2f1a9fc, 0xb3333333, 0xb374bc6a,
		0xb3b645a2, 0xb3f7ced9, 0xb4395810, 0xb47ae148, 0xb4bc6a7f, 0xb4fdf3b6,
		0xb53f7cee, 0xb5810625, 0xb5c28f5c, 0xb6041893, 0xb645a1cb, 0xb6872b02,
		0xb6c8b439, 0xb70a3d71, 0xb74bc6a8, 0xb78d4fdf, 0xb7ced917, 0xb810624e,
		0xb851eb85, 0xb89374bc, 0xb8d4fdf4, 0xb916872b, 0xb9581062, 0xb999999a,
		0xb9db22d1, 0xba1cac08, 0xba5e353f, 0xba9fbe77, 0xbae147ae, 0xbb22d0e5,
		0xbb645a1d, 0xbba5e354, 0xbbe76c8b, 0xbc28f5c3, 0xbc6a7efa, 0xbcac0831,
		0xbced9168, 0xbd2f1aa0, 0xbd70a3d7, 0xbdb22d0e, 0xbdf3b646, 0xbe353f7d,
		0xbe76c8b4, 0xbeb851ec, 0xbef9db23, 0xbf3b645a, 0xbf7ced91, 0xbfbe76c9,
		0xc0000000, 0xc0418937, 0xc083126f, 0xc0c49ba6, 0xc10624dd, 0xc147ae14,
		0xc189374c, 0xc1cac083, 0xc20c49ba, 0xc24dd2f2, 0xc28f5c29, 0xc2d0e560,
		0xc3126e98, 0xc353f7cf, 0xc3958106, 0xc3d70a3d, 0xc4189375, 0xc45a1cac,
		0xc49ba5e3, 0xc4dd2f1b, 0xc51eb852, 0xc5604189, 0xc5a1cac1, 0xc5e353f8,
		0xc624dd2f, 0xc6666666, 0xc6a7ef9e, 0xc6e978d5, 0xc72b020c, 0xc76c8b44,
		0xc7ae147b, 0xc7ef9db2, 0xc83126e9, 0xc872b021, 0xc8b43958, 0xc8f5c28f,
		0xc9374bc7, 0xc978d4fe, 0xc9ba5e35, 0xc9fbe76d, 0xca3d70a4, 0xca7ef9db,
		0xcac08312, 0xcb020c4a, 0xcb439581, 0xcb851eb8, 0xcbc6a7f0, 0xcc083127,
		0xcc49ba5e, 0xcc8b4396, 0xcccccccd, 0xcd0e5604, 0xcd4fdf3b, 0xcd916873,
		0xcdd2f1aa, 0xce147ae1, 0xce560419, 0xce978d50, 0xced91687, 0xcf1a9fbe,
		0xcf5c28f6, 0xcf9db22d, 0xcfdf3b64, 0xd020c49c, 0xd0624dd3, 0xd0a3d70a,
		0xd0e56042, 0xd126e979, 0xd16872b0, 0xd1a9fbe7, 0xd1eb851f, 0xd22d0e56,
		0xd26e978d, 0xd2b020c5, 0xd2f1a9fc, 0xd3333333, 0xd374bc6a, 0xd3b645a2,
		0xd3f7ced9, 0xd4395810, 0xd47ae148, 0xd4bc6a7f, 0xd4fdf3b6, 0xd53f7cee,
		0xd5810625, 0xd5c28f5c, 0xd6041893, 0xd645a1cb, 0xd6872b02, 0xd6c8b439,
		0xd70a3d71, 0xd74bc6a8, 0xd78d4fdf, 0xd7ced917, 0xd810624e, 0xd851eb85,
		0xd89374bc, 0xd8d4fdf4, 0xd916872b, 0xd9581062, 0xd999999a, 0xd9db22d1,
		0xda1cac08, 0xda5e353f, 0xda9fbe77, 0xdae147ae, 0xdb22d0e5, 0xdb645a1d,
		0xdba5e354, 0xdbe76c8b, 0xdc28f5c3, 0xdc6a7efa, 0xdcac0831, 0xdced9168,
		0xdd2f1aa0, 0xdd70a3d7, 0xddb22d0e, 0xddf3b646, 0xde353f7d, 0xde76c8b4,
		0xdeb851ec, 0xdef9db23, 0xdf3b645a, 0xdf7ced91, 0xdfbe76c9, 0xe0000000,
		0xe0418937, 0xe083126f, 0xe0c49ba6, 0xe10624dd, 0xe147ae14, 0xe189374c,
		0xe1cac083, 0xe20c49ba, 0xe24dd2f2, 0xe28f5c29, 0xe2d0e560, 0xe3126e98,
		0xe353f7cf, 0xe3958106, 0xe3d70a3d, 0xe4189375, 0xe45a1cac, 0xe49ba5e3,
		0xe4dd2f1b, 0xe51eb852, 0xe5604189, 0xe5a1cac1, 0xe5e353f8, 0xe624dd2f,
		0xe6666666, 0xe6a7ef9e, 0xe6e978d5, 0xe72b020c, 0xe76c8b44, 0xe7ae147b,
		0xe7ef9db2, 0xe83126e9, 0xe872b021, 0xe8b43958, 0xe8f5c28f, 0xe9374bc7,
		0xe978d4fe, 0xe9ba5e35, 0xe9fbe76d, 0xea3d70a4, 0xea7ef9db, 0xeac08312,
		0xeb020c4a, 0xeb439581, 0xeb851eb8, 0xebc6a7f0, 0xec083127, 0xec49ba5e,
		0xec8b4396, 0xeccccccd, 0xed0e5604, 0xed4fdf3b, 0xed916873, 0xedd2f1aa,
		0xee147ae1, 0xee560419, 0xee978d50, 0xeed91687, 0xef1a9fbe, 0xef5c28f6,
		0xef9db22d, 0xefdf3b64, 0xf020c49c, 0xf0624dd3, 0xf0a3d70a, 0xf0e56042,
		0xf126e979, 0xf16872b0, 0xf1a9fbe7, 0xf1eb851f, 0xf22d0e56, 0xf26e978d,
		0xf2b020c5, 0xf2f1a9fc, 0xf3333333, 0xf374bc6a, 0xf3b645a2, 0xf3f7ced9,
		0xf4395810, 0xf47ae148, 0xf4bc6a7f, 0xf4fdf3b6, 0xf53f7cee, 0xf5810625,
		0xf5c28f5c, 0xf6041893, 0xf645a1cb, 0xf6872b02, 0xf6c8b439, 0xf70a3d71,
		0xf74bc6a8, 0xf78d4fdf, 0xf7ced917, 0xf810624e, 0xf851eb85, 0xf89374bc,
		0xf8d4fdf4, 0xf916872b, 0xf9581062, 0xf999999a, 0xf9db22d1, 0xfa1cac08,
		0xfa5e353f, 0xfa9fbe77, 0xfae147ae, 0xfb22d0e5, 0xfb645a1d, 0xfba5e354,
		0xfbe76c8b, 0xfc28f5c3, 0xfc6a7efa, 0xfcac0831, 0xfced9168, 0xfd2f1aa0,
		0xfd70a3d7, 0xfdb22d0e, 0xfdf3b646, 0xfe353f7d, 0xfe76c8b4, 0xfeb851ec,
		0xfef9db23, 0xff3b645a, 0xff7ced91, 0xffbe76c9 ];
	
	var NTP_FRACTIONAL_TO_MS 	= ((1000.0)/0xFFFFFFFF);
	var NTP_TO_SECOND 			= ((1.0)/0xFFFFFFFF);
	var JAN_1ST_1900 			= 2415021;
	
	//get current time in Julian Date
	var getCurrentTime = function() {
		var time	= [0, 0];
	    var timeObj = new Date();

	    //Currently this function only operates correctly in 
	    //the 1900 - 2036 primary epoch defined by NTP
	    var JD = getJulianDay(timeObj.getUTCFullYear(), timeObj.getUTCMonth() + 1, timeObj.getUTCDate());
	    JD -= JAN_1ST_1900;
	
		if(JD >= 0) { //NTP only supports dates greater than 1900
		    var seconds = JD;
		    seconds = (seconds * 24) + timeObj.getUTCHours();
		    seconds = (seconds * 60) + timeObj.getUTCMinutes();
		    seconds = (seconds * 60) + timeObj.getUTCSeconds();
		
		    if(seconds <= 0xFFFFFFFF) { //NTP Only supports up to 2036
			    time[0] = seconds;
				time[1] = msToNtpFraction(timeObj.getUTCMilliseconds());
		    }
		}

		return time;
	}

	var add = function(time, timespan) {
	    var tempArray = [];
	    var diff = 0;
	    var frac = 0;
	    var rVal = [];
		rVal = time;
	
	    if (timespan >= 0)
		{
			tempArray[0] = Math.floor(timespan / 1000);
			tempArray[1] = Math.floor(timespan) % 1000;

		    diff = tempArray[0];
		    frac = parseFloat(('0.' + tempArray[1]));
		    frac = Math.floor(frac * 0xFFFFFFFF);

			rVal[0] += diff;
			rVal[1] += frac;
			if(rVal[1] > 0x100000000) {
				rVal[0] += 1;
				rVal[1] -= 0x100000000;
			}
		}
		else
		{
	        var d = -timespan;
	
			tempArray[0] = Math.floor(d / 1000);
			tempArray[1] = Math.floor(d) % 1000;
		    diff = parseInt(tempArray[0], 10);
		    frac = parseFloat(('0.' + tempArray[1]));
		    frac = Math.floor(frac * 0xFFFFFFFF);

			rVal[0] -= diff;
			rVal[1] -= frac;
			if(rVal[1] < 0) {
				rVal[0] -= 1;
				rVal[1] += 0x100000000;
			}
		}
	
		return rVal;
	}
	
	//convert milliseconds to 32 bits integer
	var msToNtpFraction = function(milliSeconds) {
	    if(milliSeconds < 1000) {
	    	return msToNTPArray[milliSeconds];
	    }
		
		logger.error('wrong parameter to get 32 bits milliseconds in msToNtpFraction(). milliSeconds=' + milliSeconds);
		return 0;
	}

	//convert 32 bits integer milliseonds to (0, 999)
	var ntpFractionToMs = function(fraction) {
		return Math.round(fraction * NTP_FRACTIONAL_TO_MS);
	}
	
	//convert GMT date to Julian Date
	var getJulianDay = function(year, month, day) {
	    var y = year;
	    var m = month;
	    var d = day;
	    if (m > 2) 
	       m = m - 3;
	    else 
	    {
	        m = m + 9;
	        y = y - 1;
	    }
	    
	    var c = Math.floor(y / 100);
	    var ya = y - 100 * c;
	    var j = Math.floor((146097 * c) / 4) + Math.floor((1461 * ya) / 4) + Math.floor((153 * m + 2) / 5) + d + 1721119;
	    
	    return j;
	}

	//convert Julian Date to GMT Date
	var getGregorianDate = function(JD, hour, minute, second, millisecond) {
	    var j = JD - 1721119;
	    var year = Math.floor((4 * j - 1) / 146097);
	    
	    j = 4 * j - 1 - 146097 * year;
	    
	    var day = Math.floor(j / 4);
	    j = Math.floor((4 * day + 3) / 1461);
	    day = 4 * day + 3 - 1461 * j;
	    day = Math.floor((day + 4) / 4);
	    
	    var month = Math.floor((5 * day - 3) / 153);
	    day = 5 * day - 3 - 153 * month;
	    day = Math.floor((day + 5) / 5);
	    year = 100 * year + j;
	    
	    if (month < 10) 
	        month = month + 3;
	    else 
	    {
	        month = month - 9;
	        year = year + 1;
	    }
	
		var timeObj = new Date(year, month - 1, day, hour, minute, second, millisecond);
	    return timeObj;
	}
	
	//convert Julian Date Time to Local date time
	var toLocalTime = function(timeArray) {
		if(!timeArray || !util.isArray(timeArray) || (timeArray.length !== 2)) {
			return null;
		}
		
	    //Currently this function only operates correctly in the 1900 - 2036 primary epoch defined by NTP
	    var year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0, milliseconds = 0;
	    var s = timeArray[0];
		var zone = new Date().getTimezoneOffset() * 60;
	    s -= zone;   
	
	    second = s % 60;
	    s = Math.floor(s / 60);
	    minute = s % 60;
	    s = Math.floor(s / 60);
	    hour = s % 24;
	    s = Math.floor(s / 24);
	    
	    var JD = s + JAN_1ST_1900;
	    milliseconds = ntpFractionToMs(timeArray[1]);
	
	    return getGregorianDate(JD, hour, minute, second, milliseconds);
	}
	
	//simulate 64 bits integer minute operation
	var minuteOPOf64Bits = function(op1, op2) {
		var result = [];
		
		if(!op1 || !op2 || !util.isArray(op1) || !util.isArray(op2) || (op1.length !== 2) || (op2.length !== 2)) {
			logger.error('wrong parameter in minuteOPOf64Bits().');
			logger.error(op1);
			logger.error(op2);
			return null;
		}	
		
		if(op1[1] < op2[1]) {
			result[0] = op1[0] - op2[0] - 1;
			result[1] = op1[1] - op2[1] + 0x100000000;
		}
		else {
			result[0] = op1[0] - op2[0];
			result[1] = op1[1] - op2[1];
		}
		
		return result;
	}
	
	//simulate 64 bits integer plus operation
	var plusOPOf64Bits = function(op1, op2) {
		var result = [];
		
		if(!op1 || !op2 || !util.isArray(op1) || !util.isArray(op2) || (op1.length !== 2) || (op2.length !== 2)) {
			logger.error('wrong parameter in plusOPOf64Bits().');
			logger.error(op1);
			logger.error(op2);
			return null;
		}	
		
		result[1] = op1[1] + op2[1];
		if(result[1] > 0x100000000) {
			result[1] -= 0x100000000;
			result[0] = op1[0] + op2[0] + 1;
		}
		else {
			result[0] = op1[0] + op2[0];
		}
		
		return result;
	}
	
	//parse NTP Server response from buffer to data structure
	var parseResponsePackage = function(dataBuffer, totalSize) {
		var ntpResponsePackage = {};
		
		if(!dataBuffer) {
			logger.error('wrong parameter in parseResponsePackage().');
			logger.error(dataBuffer);
			return null;
		}
		
		if(dataBuffer.length === 48) {
			ntpResponsePackage.stratum 			= parseInt(dataBuffer[1]);
			ntpResponsePackage.leapIndicator 	= (parseInt(dataBuffer[0]) & 0xC0) >> 6;
			
			ntpResponsePackage.originateTime 	= [];
			ntpResponsePackage.originateTime[0]	= 	((parseInt(dataBuffer[24]) * Math.pow(2, 24))) + 
													((parseInt(dataBuffer[25]) * Math.pow(2, 16)) & 0x00FF0000) + 
													((parseInt(dataBuffer[26]) * Math.pow(2, 8)) & 0x0000FF00) + 
													(parseInt(dataBuffer[27]) & 0x000000FF);
			ntpResponsePackage.originateTime[1]	= 	((parseInt(dataBuffer[28]) * Math.pow(2, 24))) + 
													((parseInt(dataBuffer[29]) * Math.pow(2, 16)) & 0x00FF0000) + 
													((parseInt(dataBuffer[30]) * Math.pow(2, 8)) & 0x0000FF00) + 
													(parseInt(dataBuffer[31]) & 0x000000FF);
			
			ntpResponsePackage.receiveTime 	= [];
			ntpResponsePackage.receiveTime[0]	= 	((parseInt(dataBuffer[32]) * Math.pow(2, 24))) + 
													((parseInt(dataBuffer[33]) * Math.pow(2, 16)) & 0x00FF0000) + 
													((parseInt(dataBuffer[34]) * Math.pow(2, 8)) & 0x0000FF00) + 
													(parseInt(dataBuffer[35]) & 0x000000FF);
			ntpResponsePackage.receiveTime[1]	= 	((parseInt(dataBuffer[36]) * Math.pow(2, 24))) + 
													((parseInt(dataBuffer[37]) * Math.pow(2, 16)) & 0x00FF0000) + 
													((parseInt(dataBuffer[38]) * Math.pow(2, 8)) & 0x0000FF00) + 
													(parseInt(dataBuffer[39]) & 0x000000FF);
			
			ntpResponsePackage.transmitTime 	= [];
			ntpResponsePackage.transmitTime[0]	= 	((parseInt(dataBuffer[40]) * Math.pow(2, 24))) + 
													((parseInt(dataBuffer[41]) * Math.pow(2, 16)) & 0x00FF0000) + 
													((parseInt(dataBuffer[42]) * Math.pow(2, 8)) & 0x0000FF00) + 
													(parseInt(dataBuffer[43]) & 0x000000FF);
			ntpResponsePackage.transmitTime[1]	= 	((parseInt(dataBuffer[44]) * Math.pow(2, 24))) + 
													((parseInt(dataBuffer[45]) * Math.pow(2, 16)) & 0x00FF0000) + 
													((parseInt(dataBuffer[46]) * Math.pow(2, 8)) & 0x0000FF00) + 
													(parseInt(dataBuffer[47]) & 0x000000FF);
		}
		else {
			logger.error('unexpected data size. data length=' + dataBuffer.length);
			return null;
		}
		
		return ntpResponsePackage;
	}
	
	
	
	
	var dgram = require('dgram');
	
	//return 0 means success
	//return 1 means error occurs when create socket
	//return 2 means error occurs when send data via socket
	//return 3 means error occurs when parse the returned data.
	//return 4 means wrong parameters.
	//return 5 means error occurs when process time data.
	var syncToNTPServer = function(serverHost, callback) {
		if((typeof serverHost !== 'string') || !serverHost) {
			return callback(4, null);
		}
		
		var ntpBasicInfo = new Buffer(48);
		ntpBasicInfo.fill(0);
		ntpBasicInfo[0] = 27;  //Encoded representation which represents NTP Client Request & NTP version 3.0
		var curTime = [];
		curTime = getCurrentTime();
		
		if(curTime && util.isArray(curTime) && curTime.length) { //convert 64 bits current date time to binary buffer.
			ntpBasicInfo[40] = curTime[0] >> 24;
			ntpBasicInfo[41] = (curTime[0] >> 16) & 0xFF;
			ntpBasicInfo[42] = (curTime[0] >> 8) & 0xFF;
			ntpBasicInfo[43] = curTime[0] & 0xFF;
			ntpBasicInfo[44] = curTime[1] >> 24;
			ntpBasicInfo[45] = (curTime[1] >> 16) & 0xFF;
			ntpBasicInfo[46] = (curTime[1] >> 8) & 0xFF;
			ntpBasicInfo[47] = curTime[1] & 0xFF;
		}
//console.log(ntpBasicInfo);		

		var client = dgram.createSocket("udp4");
		if(!client) {
console.log('fail to create UDP socket.');
			logger.error('fail to create UDP socket.');			
			return callback(1, null);
		}
		
		client.on("error", function (err) {
console.log("server error:\n" + err.stack);
			logger.error('error occurs when get data from NTP Server. err=');
		  	logger.error(err);
		  	client.close();
		});
		
		client.on("message", function (msg, rinfo) {
/*
console.log(JSON.stringify(rinfo, '', 4));
console.log('msg.length='+msg.length);
console.log(util.isArray(msg));
console.log(msg);
*/
			var clientReceiveTime = getCurrentTime();

		  	client.close();
			
			//parse the response from NTP Server to get 3 64 bits data for time difference calculation
			response = parseResponsePackage(msg, rinfo.size);
			if(!response) { //error occur when data parsing
			  	logger.error('error occurs when parse the data returned from NTP Server. Buffer=');
			  	logger.error(msg);
			  	logger.error('rinfo=');
			  	logger.error(rinfo);
			  	
			  	return callback(3, null);
			}
			
			//set client receive time for time difference calculation
			response.destinationTime = clientReceiveTime;
			
			if((response.destinationTime[0] === 0) || (response.originateTime[0] === 0) || (response.transmitTime[0] === 0) || (response.receiveTime[0] === 0)) {
			  	logger.error('the data returned from NTP Server is not correct. Buffer=');
			  	logger.error(msg);
			  	logger.error('rinfo=');
			  	logger.error(rinfo);
			  	logger.error('response=');
			  	logger.error(response);
			  	
			  	return callback(3, null);
			}
			
/*
console.log('response.destinationTime=');
console.log(response.destinationTime[0].toString(16) + ' ' + response.destinationTime[1].toString(16));
console.log('response.originateTime=');
console.log(response.originateTime[0].toString(16) + ' ' + response.originateTime[1].toString(16));
console.log('response.transmitTime=');
console.log(response.transmitTime[0].toString(16) + ' ' + response.transmitTime[1].toString(16));
console.log('response.receiveTime=');
console.log(response.receiveTime[0].toString(16) + ' ' + response.receiveTime[1].toString(16));
*/			
			var midResult1 = null;
			midResult1 = minuteOPOf64Bits(response.destinationTime, response.originateTime);
			if(midResult1) {
				var midResult2 = null;
				midResult2 = minuteOPOf64Bits(response.transmitTime, response.receiveTime);
				if(midResult2) {
					response.roundTripDelay = minuteOPOf64Bits(midResult1, midResult2);
//console.log('ntpFractionToMs(response.roundTripDelay[1])=');
//console.log(ntpFractionToMs(response.roundTripDelay[1]));
					response.roundTripDelay = response.roundTripDelay[0] * 1000 + ntpFractionToMs(response.roundTripDelay[1]);
				}
				else {
					logger.error('error occurs when call minuteOPOf64Bits()');
					logger.error('response.transmitTime=');
					logger.error(response.transmitTime);
					logger.error('response.receiveTime=');
					logger.error(response.receiveTime);
					
				  	return callback(5, null);
				}
			}
			else {
				logger.error('error occurs when call minuteOPOf64Bits()');
				logger.error('response.destinationTime=');
				logger.error(response.destinationTime);
				logger.error('response.originateTime=');
				logger.error(response.originateTime);
				
			  	return callback(5, null);
			}
//console.log('response.roundTripDelay=');
//console.log(response.roundTripDelay);

			midResult1 = null;
			midResult1 = minuteOPOf64Bits(response.receiveTime, response.originateTime);
//console.log('midResult1=');
//console.log(midResult1);
			if(midResult1) {
				var midResult2 = null;
				midResult2 = minuteOPOf64Bits(response.transmitTime, response.destinationTime);
//console.log('midResult2=');
//console.log(midResult2);
				if(midResult2) {
					var midResult3 = [];
					midResult3 = plusOPOf64Bits(midResult1, midResult2);
//console.log('midResult3=');
//console.log(midResult3);
					if(midResult3) {
						response.localClockOffset = midResult3[0] * 1000 + ntpFractionToMs(midResult3[1]);
//console.log('response.localClockOffset=');
//console.log(response.localClockOffset);
						response.localClockOffset = response.localClockOffset / 2;
//console.log('response.localClockOffset=');
//console.log(response.localClockOffset);
					}
					else {
						logger.error('error occurs when call plusOPOf64Bits()');
						logger.error('midResult1=');
						logger.error(midResult1);
						logger.error('midResult2=');
						logger.error(midResult2);
						
					  	return callback(5, null);
					}
				}
				else {
					logger.error('error occurs when call minuteOPOf64Bits()');
					logger.error('response.transmitTime=');
					logger.error(response.transmitTime);
					logger.error('response.destinationTime=');
					logger.error(response.destinationTime);
					
				  	return callback(5, null);
				}
			}
			else {
				logger.error('error occurs when call minuteOPOf64Bits()');
				logger.error('response.receiveTime=');
				logger.error(response.receiveTime);
				logger.error('response.originateTime=');
				logger.error(response.originateTime);
				
			  	return callback(5, null);
			}
//console.log('response.localClockOffset=');
//console.log(response.localClockOffset);
			
//console.log('response');
//console.log(JSON.stringify(response, '', 4));
		  	return callback(0, response);
		});
		
		client.on("listening", function () {
		  var address = client.address();
//console.log("client listening " + address.address + ":" + address.port);
		});

		client.send(ntpBasicInfo, 0, ntpBasicInfo.length, 123, serverHost, function(err, bytes) {
			logger.debug('send data to NTP Server socket.');
//console.log('send data to NTP Server socket.');

			if(err) {
				logger.error('error occurs when send data to NTP Server. err=');
				logger.error(err);
console.log('error occurs when send data to NTP Server. err=');
console.log(err);
				return callback(2, null);
			}
		});		
	}
	
	this.syncTime = function(serverHost, timeDiffThreshold, delayThreshold, callback) {
		if((typeof serverHost !== 'string') || !serverHost || (typeof timeDiffThreshold !== 'number') || (timeDiffThreshold < 0) || 
			 (typeof delayThreshold !== 'number') || (delayThreshold < 0)) {
			return callback(4, null);
		}
		
		var retriedTimes = 0;
		var Emitter 	= require('events').EventEmitter;
		var emitter		= (new Emitter);
		var error		= 0;
		var retryTimes	= 10;
		var delayCount	= 3;
		var offsetArray	= [];
	    var synchronizeClock = false;
	    var value = 0.0;
		    		
		
		emitter.on('SyncOnce', function(first, op) {
			if(!first) {
				retriedTimes ++;
			}

			if(retriedTimes > retryTimes) {
				return callback(error);
			}
			
			if(op === 'sync') {
				logger.debug('will sync time. time difference is:' + value);

//				var curTime = getCurrentTime();
//				var newTime = add(curTime, Math.floor(value));
//				var timeObj = toLocalTime(newTime);

				var timeObj = new Date();
				timeObj = new Date(timeObj.getTime() + Math.floor(value));				
				controllerCmd.setLocalTime(helper, timeObj, function(err) {
					if(err) {
console.log('error occurs when set local time. ' + err);
						logger.error('error occurs when set local time. ' + err);
					}
					
					return callback(err);
				});
			}
			else if(op === 'stop') {
				logger.debug('time is accurate, not need to sync time. ' + value);
				return callback(0);
			}
			else {
				syncToNTPServer(serverHost, function(err, response) {
					if(err) { 
						if(err === 4) { //parameter wrong, need not retry.
							logger.error('parameter error.');
							return callback(err);
						}
						else {
							error = err;
							emiter.emit('SyncOnce', false, '');
						}
					}
					else { //check whether need to set local time or not
//console.log(response);
//console.log('response.destinationTime=');
//console.log(response.destinationTime[0].toString(16) + ' ' + response.destinationTime[1].toString(16));
//console.log('response.originateTime=');
//console.log(response.originateTime[0].toString(16) + ' ' + response.originateTime[1].toString(16));
//console.log('response.transmitTime=');
//console.log(response.transmitTime[0].toString(16) + ' ' + response.transmitTime[1].toString(16));
//console.log('response.receiveTime=');
//console.log(response.receiveTime[0].toString(16) + ' ' + response.receiveTime[1].toString(16));
//console.log(response.localClockOffset);
//console.log(response.roundTripDelay);
						var finish = function(sync) {
					    	if (sync)
						    {
				    		    logger.debug("set time."); 
					    		emitter.emit('SyncOnce', false, 'sync');
							}
							else {
								emitter.emit('SyncOnce', false, 'stop');
							}
							
							return;
						}
			    		
			    		error = 0;
			    		
		    		    if ((response.roundTripDelay >= delayThreshold) || (Math.abs(response.localClockOffset) >= (2.0 * timeDiffThreshold))) { //big difference
		    		        if (response.roundTripDelay >= delayThreshold) {
//console.log("delay is too big. offset:%d, delay:%d, delay threshold:%d.", response.localClockOffset, response.roundTripDelay, delayThreshold); 
		        		        logger.debug("delay is too big. offset:%d, delay:%d, delay threshold:%d.", response.localClockOffset, response.roundTripDelay, delayThreshold); 
		        		    }
		        		    else {
//console.log("offset is too big. offset:%d, delay:%d, offset threshold:%d.", response.localClockOffset, response.roundTripDelay, timeDiffThreshold); 
		        		        logger.debug("offset is too big. offset:%d, delay:%d, offset threshold:%d.", response.localClockOffset, response.roundTripDelay, timeDiffThreshold); 
		    		        }
		    		        
		    		        offsetArray.push(response.localClockOffset);
			    	        if ((offsetArray.length) >= delayCount)
			    	        {
			    	            for (var ki = 0; ki < offsetArray.length; ki++)
			    	            {
			    	                value += offsetArray[ki];
			    	            }
			    	            
			    	            value /= offsetArray.length;
console.log("delay/offset is too big %d times. calculate average offset:%d, reset.", offsetArray.length, value); 
		            		    logger.debug("delay/offset is too big %d times. calculate average offset:%d, reset.", offsetArray.length, value); 
		                        synchronizeClock = (Math.abs(value) >= timeDiffThreshold);
		                        offsetArray = [];
		                    	finish(synchronizeClock);
		                    	return;
				            }
		    		        else
		    		        {
console.log("-----delay/offset is too big %d/%d times. continue.", offsetArray.length, delayCount); 
		               		    logger.debug("-----delay/offset is too big %d/%d times. continue.", offsetArray.length, delayCount); 
		    		            emitter.emit('SyncOnce', false, '');
		    		            return;
		    		        }
		    		    }
		    		    else
		    		    {
		                    synchronizeClock = (Math.abs(response.localClockOffset) >= timeDiffThreshold);
		                    value = response.localClockOffset;
		                    offsetArray = [];
		                    finish(synchronizeClock);
		                    return;
		                }    
					}
				});
			}
		});
	
		emitter.emit('SyncOnce', true, '');
	}
};
module.exports = NTPTime;




