import re, colorsys;



def hex2color(color_str):
	re_color = re.compile(r"^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$");
	m = re_color.match(color_str);

	if (m is None):
		color = ( 0.0 , 0.0 , 0.0, 1.0 );
	else:
		c = m.group(1);
		seg = len(c) // 3;
		color = ( int(c[0 : seg], 16) / 255.0, int(c[seg : seg * 2], 16) / 255.0, int(c[seg * 2 : seg * 3], 16) / 255.0, 1.0 );

	return color;



def color2sort(page):
	c = hex2color(page["color"]);
	hsv = colorsys.rgb_to_hsv(c[0], c[1], c[2]);
	return (hsv[0], page["name"]);



def generate_region_tags(page):
	value = [];

	has_info = "info" in page;
	has_info = False;

	if (has_info):
		value.append(
			'<span class="region_description_text">{0:s}</span>'.format(page["info"])
		);

	if ("tags" in page and len(page["tags"]) > 0):
		value.append('<span class="region_description_tags">');

		if (has_info):
			value.append(' &bull; ');

		for i in range(len(page["tags"])):
			tag = page["tags"][i];

			if (i > 0):
				value.append(' &bull; ');

			value.append('<a class="region_description_tag"><span>{0:s}</span></a>'.format(tag));

		value.append('</span>');

	return "".join(value);



def generate_repository_tags(page):
	value = [];

	has_info = "info" in page;
	has_info = False;

	if (has_info):
		value.append(
			'<span class="repository_info_text">{0:s}</span>'.format(page["info"])
		);

	if ("tags" in page and len(page["tags"]) > 0):
		value.append('<div class="repository_tags">');

		if (has_info):
			value.append(' &bull; ');

		for i in range(len(page["tags"])):
			tag = page["tags"][i];

			if (i > 0):
				value.append(' &bull; ');

			value.append('<span class="repository_tag"><span>{0:s}</span></span>'.format(tag));

		value.append('</div>');

	return "".join(value);



# Color settings
colored = True;



# Repositories
repos = [
	{
		"name": "crx",
		"name_full": "Chrome Extension Building Tools",
		"description": "Tools to help compile a Chrome extension from a userscript",
		"info": "Command line application",
		"tags": [ "python", "userscript", "chrome", ],
		"color": "#4195dc",
	},
	{
		"name": "uyt",
		"name_full": "Usable YouTube",
		"description": "Makes YouTube more usable",
		"info": "Web browser extension",
		"tags": [ "javascript", "userscript", "youtube", ],
		"color": "#e42b28",
	},
	{
		"name": "vsd",
		"name_full": "Virtual SD Card Tools",
		"description": "Easily create and manage virtual disks on Windows",
		"info": "Command line application",
		"tags": [ "python", "windows", ],
		"color": "#60bf20",
	},
	{
		"name": "lan",
		"name_full": "Local Area Network File Sharing",
		"description": "A simple way to share files across a local area network",
		"info": "Command line application",
		"tags": [ "javascript", "node.js", ],
		"color": "#d73c9e",
	},
	{
		"name": "264",
		"name_full": "x264 Video Encoding Tools",
		"description": "Easier x264 interaction with 32bit and 64bit processes",
		"info": "Command line application",
		"tags": [ "python", "x264", "ffmpeg", ],
		"color": "#e38939",
	},
	{
		"name": "t2m",
		"name_full": "Torrent to Magnet",
		"description": "Javascript implementation of magnet URI generation",
		"info": "Web application &amp; libraries",
		"tags": [ "javascript", "library", ],
		"color": "#30b194",
	},
	{
		"name": "pyp",
		"name_full": "Python Preprocessor",
		"description": "Run python code inside files",
		"info": "Command line application",
		"tags": [ "c", "python", "windows", ],
		"color": "#7d09c7",
	},
	{
		"name": "ass",
		"name_full": "Advanced SubStation Alpha Python Library",
		"description": "Easy macro commands for modifying .ass files",
		"info": "Python library",
		"tags": [ "python", "library", "subtitles", ],
		"color": "#ebcd31",
	},
	{
		"name": "ave",
		"name_full": "Audio-Video Extensions",
		"description": "A set of experimental audio/video filters to be used with AviSynth",
		"tags": [ "c++", "avisynth", ],
		"color": "#1257e3",
	},
	{
		"name": "and",
		"name_full": "Android Project Template",
		"description": "A set of batch commands used to set-up and automate an Android project",
		"tags": [ "java", "android", ],
		"color": "#3abde8",
	},
	{
		"name": "icm",
		"name_full": "Image Coordinate Mapper",
		"description": "Quick way to mark coordinates on an image",
		"tags": [ "javascript", ],
		"color": "#e0a926",
	},
	{
		"name": "yia",
		"name_full": "YouTube Iframe API",
		"description": "Easily create and interact with embedded YouTube videos",
		"tags": [ "javascript", "youtube", ],
		"color": "#e45e28",
	},
	{
		"name": "ebml",
		"name_full": "EBML Library",
		"description": "A library for reading, writing, and modifying the Matroska container's EBML format",
		"tags": [ "python", "library" ],
		"color": "#4728c7",
	},
	{
		"name": "lex",
		"name_full": "Lexical Analysis Libraries",
		"description": "Simple lexical analysis libraries for JavaScript and Python",
		"tags": [ "javascript", "python", "library" ],
		"color": "#cd0e5a",
	},
	{
		"name": "noise",
		"name_full": "Simplex Noise Library",
		"description": "Templated CPU implementation of simplex noise",
		"tags": [ "c++", "library", "noise" ],
		"color": "#1cb327",
	},
];



# Gists
gist_meta = [
	( "html" , "#d9319c" ),
	( "javascript" , "#8000ff" ),
	( "userscript" , "#0080ff" ),
	( "python" , "#60c020" ),
	( "cpp" , "#e09a14" ),
];

gists = [
	{
		"name": "Google logo remover",
		"main_file": "google_nologo.user.js",
		"description": "Hides the logo on the Google homepage because it changes too much",
		"url": "https://gist.github.com/nutbread/7c8a536fc19ef5f6151d",
		"type": "userscript",
	},
	{
		"name": "CRC checker",
		"main_file": "crc.py",
		"description": "Easy way to get the CRC32 of files, and automatically rename them if necessary",
		"url": "https://gist.github.com/nutbread/b8111bb93156a20d3bb4",
		"type": "python",
	},
	{
		"name": ".zip creation library",
		"main_file": "Zipper.js",
		"description": "Class to put arbitrary data into a storage-mode .zip file",
		"url": "https://gist.github.com/nutbread/6d3f939d9295e95f135e",
		"type": "javascript",
	},
	{
		"name": "DOM node generation",
		"main_file": "$.js",
		"description": "Brief node generation without the overhead of jQuery",
		"url": "https://gist.github.com/nutbread/58f73919109a100cb481",
		"type": "javascript",
	},
	{
		"name": "Timing function",
		"main_file": "timing.js",
		"description": "High precision interval timing function",
		"url": "https://gist.github.com/nutbread/011ea50a28190bb66224",
		"type": "javascript",
	},
	{
		"name": "Document ready function",
		"main_file": "on_ready.js",
		"description": "Document ready detection for a variety of circumstances",
		"url": "https://gist.github.com/nutbread/db273ef22203755184c5",
		"type": "javascript",
	},
	{
		"name": "Asynchronous data saving",
		"main_file": "Save.js",
		"description": "Asynchronous saving for scripts in Greasemonkey, Tampermonkey, Chrome, and webpage embeding",
		"url": "https://gist.github.com/nutbread/ac22d7f9419c55e3f96f",
		"type": "javascript",
	},
	{
		"name": "Fast bind",
		"main_file": "bind.js",
		"description": "Faster function binding than function.bind(...)",
		"url": "https://gist.github.com/nutbread/fbdb8970e0a8c8124742",
		"type": "javascript",
	},
	{
		"name": "Colorspace conversions",
		"main_file": "Color.js",
		"description": "Some colorspace conversion functions similar to Python's <a class=\"light_underline light_underline_hover\" href=\"https://docs.python.org/2/library/colorsys.html\" target=\"_blank\"><span><code>colorsys</code></span></a> library",
		"url": "https://gist.github.com/nutbread/776059380da9e2e9b483",
		"type": "javascript",
	},
	{
		"name": "URL parsing for browsers",
		"main_file": "URLParser.js",
		"description": "Similar functionality as that found in the node.js <a class=\"light_underline light_underline_hover\" href=\"https://nodejs.org/api/url.html\" target=\"_blank\"><span><code>url</code></span></a> library",
		"url": "https://gist.github.com/nutbread/ecc6d75f19db3e95ce91",
		"type": "javascript",
	},
	{
		"name": "Lambert W function",
		"main_file": "productlog.py",
		"description": "Improved Python implementation of the <a class=\"light_underline light_underline_hover\" href=\"https://en.wikipedia.org/wiki/Lambert_W_function\" target=\"_blank\"><span>Lambert W function</span></a>",
		"url": "https://gist.github.com/nutbread/2e718018c31fa92514a7",
		"type": "python",
	},
	{
		"name": "C++11 assertions",
		"main_file": "Assert.cpp",
		"description": "Improved, modifiable C++11 assertions with message capability",
		"url": "https://gist.github.com/nutbread/313583c979274564d2f8",
		"type": "cpp",
	},
	{
		"name": "Int to float precision loss test",
		"main_file": "int_to_float_exact.py",
		"description": "Test if an integer value can be converted to a float and retain its exact representation",
		"url": "https://gist.github.com/nutbread/62f9ed5cb8b0a124d9b3",
		"type": "python",
	},
	{
		"name": "Colored command prompt",
		"main_file": "ccmd.cpp",
		"description": "Exactly as the title says",
		"url": "https://gist.github.com/nutbread/e24c9a557de3ecba4bcc",
		"type": "cpp",
	},
	{
		"name": "CSS transition stopping",
		"main_file": "transitions.html",
		"description": "A JavaScript method of stopping CSS transitions while they're active",
		"url": "https://gist.github.com/nutbread/cece7128350dbdbb7271",
		"type": "html",
	}
];



if (not colored):
	c = "#404040";
	gist_meta = [ (x[0],c) for x in gist_meta ];
	for r in repos: r["color"] = c;



# Sort
repos.sort(key=lambda i: color2sort(i));
gist_classes = {};
for g in gists:
	if (g["type"] not in gist_classes):
		gist_classes[g["type"]] = [];
	gist_classes[g["type"]].append(g);
for g,v in gist_classes.items():
	v.sort(key=lambda i: i["main_file"].lower());


