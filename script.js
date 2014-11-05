


(function () {
	"use strict";

	// Module for performing actions as soon as possible
	var ASAP = (function () {

		// Variables
		var state = 0;
		var callbacks_asap = [];
		var callbacks_ready = [];
		var callbacks_check = [];
		var callback_check_interval = null;
		var callback_check_interval_time = 20;
		var on_document_readystatechange_interval = null;



		// Events
		var on_document_readystatechange = function () {
			// State check
			if (document.readyState == "interactive") {
				if (state == 0) {
					// Mostly loaded
					state = 1;

					// Callbacks
					var c = callbacks_asap;
					callbacks_asap = null;
					trigger_callbacks(c);
				}
			}
			else if (document.readyState == "complete") {
				// Loaded
				state = 2;

				// Callbacks
				var c;
				if (callbacks_asap !== null) {
					c = callbacks_asap;
					callbacks_asap = null;
					trigger_callbacks(c);
				}

				c = callbacks_ready;
				callbacks_ready = null;
				trigger_callbacks(c);

				// Complete
				clear_events();
			}
		};
		var on_callbacks_check = function () {
			// Test all
			for (var i = 0; i < callbacks_check.length; ++i) {
				if (callback_test.call(null, callbacks_check[i])) {
					// Remove
					callbacks_check.splice(i, 1);
					--i;
				}
			}

			// Stop timer?
			if (callbacks_check.length == 0) {
				clearInterval(callback_check_interval);
				callback_check_interval = null;
			}
		};
		var on_callback_timeout = function (data) {
			// Remove
			for (var i = 0; i < callbacks_check.length; ++i) {
				if (callbacks_check[i] === data) {
					// Update
					data.timeout_timer = null;

					// Callback
					if (data.timeout_callback) data.timeout_callback.call(null);

					// Remove
					callbacks_check.splice(i, 1);
					return;
				}
			}
		};

		// Clear events
		var clear_events = function () {
			if (on_document_readystatechange_interval !== null) {
				// Remove timer
				clearInterval(on_document_readystatechange_interval);
				on_document_readystatechange_interval = null;

				// Remove events
				document.removeEventListener("readystatechange", on_document_readystatechange, false);

				// Clear callbacks
				callbacks_asap = null;
				callbacks_ready = null;
			}
		};

		// Test callback
		var callback_test = function (data) {
			if (!data.condition || data.condition.call(null)) {
				// Call
				data.callback.call(null);

				// Stop timeout
				if (data.timeout_timer !== null) {
					clearTimeout(data.timeout_timer);
					data.timeout_timer = null;
				}

				// Okay
				return true;
			}

			// Not called
			return false;
		};
		var callback_wait = function (data) {
			// Add to list
			callbacks_check.push(data);
			if (callback_check_interval === null) {
				callback_check_interval = setInterval(on_callbacks_check, callback_check_interval_time);
			}

			// Timeout
			if (data.timeout > 0) {
				data.timeout_timer = setTimeout(on_callback_timeout.bind(null, data), data.timeout * 1000);
			}
		};

		// Trigger callback list
		var trigger_callbacks = function (callback_list) {
			for (var i = 0, j = callback_list.length; i < j; ++i) {
				// Test
				if (!callback_test.call(null, callback_list[i])) {
					// Queue
					callback_wait.call(null, callback_list[i]);
				}
			}
		};

		// Add callback
		var add_callback = function (callback, condition, timeout, timeout_callback, target) {
			var cb_data = {
				callback: callback,
				condition: condition || null,
				timeout: timeout || 0,
				timeout_callback: timeout_callback || null,
				timeout_timer: null
			};

			if (target === null) {
				// Test
				if (!callback_test.call(null, cb_data)) {
					// Queue
					callback_wait.call(null, cb_data);
				}
			}
			else {
				// Add
				target.push(cb_data);
			}
		};

		// Setup events
		on_document_readystatechange();
		if (state < 2) {
			document.addEventListener("readystatechange", on_document_readystatechange, false);
			on_document_readystatechange_interval = setInterval(on_document_readystatechange, 20);
		}



		// Return functions
		return {

			/**
				Call a function as soon as possible when the DOM is fully loaded
				(document.readyState == "interactive")

				@param callback
					The callback to be called
					The call format is:
						callback.call(null)
				@param condition
					An additional condition to test for.
					If this condition is falsy, a timeout interval is
					used to continuously test it until it is true (or timed out)
					The call format is:
						condition.call(null)
				@param timeout
					If specified, a maximum time limit is given for the condition to be met
					Must be greater than 0, units are seconds
				@param timeout_callback
					If specified, this is a callback which is called when the condition check
					has timed out
					The call format is:
						timeout_callback.call(null)
			*/
			asap: function (callback, condition, timeout, timeout_callback) {
				// Add to asap
				add_callback.call(null, callback, condition, timeout, timeout_callback, callbacks_asap);
			},
			/**
				Call a function as soon as possible when the DOM is fully loaded
				(document.readyState == "complete")

				@param callback
					The callback to be called
					The call format is:
						callback.call(null)
				@param condition
					An additional condition to test for.
					If this condition is falsy, a timeout interval is
					used to continuously test it until it is true (or timed out)
					The call format is:
						condition.call(null)
				@param timeout
					If specified, a maximum time limit is given for the condition to be met
					Must be greater than 0, units are seconds
				@param timeout_callback
					If specified, this is a callback which is called when the condition check
					has timed out
					The call format is:
						timeout_callback.call(null)
			*/
			ready: function (callback, condition, timeout, timeout_callback) {
				// Add to ready
				add_callback.call(null, callback, condition, timeout, timeout_callback, callbacks_ready);
			},

		};

	})();



	// Class to manage URL navigation with the hash fragment
	var HashNavigation = (function () {

		var HashNavigation = function () {
			this.sep = "#!";

			this.events = {
				"change": [],
			};
		};



		var re_encode_pretty = /\%20/g,
			re_decode_pretty = /\+/g,
			re_decode_var = /^(.*?)(?:=(.*))?$/,
			re_encode_simple = /[ %]/g,
			re_encode_simple_map = {
				" ": "+",
				"%": "%25",
			},
			re_url_info = /^(?:([a-z][a-z0-9\-\+\.]*):)?(?:\/*)([^\/\?\#]*)([^\?\#]*)([^\#]*)(.*)$/i,
			re_url_offset_str = "x:x/x?x#";

		var escape_var = function (str) {
			return encodeURIComponent(str).replace(re_encode_pretty, "+");
		};
		var escape_var_simple = function (str) {
			return str.replace(re_encode_simple, escape_var_simple_replacer);
		};
		var escape_var_simple_replacer = function (m) {
			return re_encode_simple_map[m[0]];
		};
		var unescape_var_pretty = function (str) {
			return decodeURIComponent(str.replace(re_decode_pretty, "%20"));
		};
		var unescape_var = function (str) {
			return decodeURIComponent(str);
		};

		var on_window_popstate = function (event) {
			// Trigger
			trigger.call(this, "change", {
				init: false,
				pop: true,
			});
		}

		var trigger = function (event, data) {
			// Trigger an event
			var callbacks = this.events[event],
				i;

			for (i = 0; i < callbacks.length; ++i) {
				callbacks[i].call(this, data, event);
			}
		};



		HashNavigation.prototype = {
			constructor: HashNavigation,

			/**
				Get information from a URL string.

				@param url
					The stringified URL
				@param offset
					An integer representing the URL component to start at.
					Valid values are:
						0: start at the protocol (this is the default)
						1: start at the website name
						2: start at the website path
						3: start at the search
						4: start at the hash fragment
					Invalid values will cause undefined behavior
				@return
					An object of the form:
					{
						protocol: string,
						site: string,
						path: string,
						search: string,
						hash: string,
					}
			*/
			get_url_parts: function (url, offset) {
				var default_value = "",
					parts = [
						default_value, // protocol
						default_value, // site
						default_value, // path
						default_value, // search
						default_value, // hash
					],
					match, i, obj;

				// Update string and match
				offset = offset || 0;
				if (offset > 0) url = re_url_offset_str.substr(0, offset * 2) + url;
				match = re_url_info.exec(url);

				// Parts
				for (i = offset; i < 5; ++i) {
					parts[i] = match[i + 1] || default_value;
				}

				// Object
				obj = {
					protocol: parts[0],
					site: parts[1],
					path: parts[2],
					search: parts[3],
					hash: parts[4],
				};

				// Done
				return obj;
			},

			strip_hash: function (hash) {
				var i;
				for (i = 0; i < this.sep.length; ++i) {
					if (hash[i] != this.sep[i]) break;
				}
				if (i > 0) {
					hash = hash.substr(i);
				}
				return hash;
			},
			strip_search: function (search) {
				return (search[0] == "?") ? search.substr(1) : search;
			},

			encode_vars: function (vars, escape_components) {
				var str = "",
					first = true,
					escape_fcn = (escape_components == null || escape_components) ? escape_var : escape_var_simple,
					v;

				if (Array.isArray(vars)) {
					for (v = 0; v < vars.length; ++v) {
						if (v > 0) str += "&";

						str += escape_fcn(vars[v][0]);
						if (vars[v].length > 1) {
							str += "=";
							str += escape_fcn(vars[v][1]);
						}
					}
				}
				else {
					for (v in vars) {
						if (first) first = false;
						else str += "&";

						str += escape_fcn(v);
						if (vars[v] != null) {
							str += "=";
							str += escape_fcn(vars[v]);
						}
					}
				}

				return str;
			},
			decode_vars: function (str, not_pretty) {
				var vars = {},
					str_split = str.split("&"),
					escape_fcn = (not_pretty === true) ? unescape_var : unescape_var_pretty,
					match, i;

				for (i = 0; i < str_split.length; ++i) {
					// Get the match
					if (str_split[i].length == 0) continue;
					match = re_decode_var.exec(str_split[i]);

					// Set the var
					vars[escape_fcn(match[1])] = (match[2] == null) ? null : escape_fcn(match[2]);
				}

				// Return the vars
				return vars;
			},

			setup: function () {
				// Events
				window.addEventListener("popstate", on_window_popstate.bind(this), false);

				// Init trigger
				trigger.call(this, "change", {
					init: true,
					pop: false,
				});
			},
			go: function (hash, replace) {
				// Setup url
				var url = window.location.pathname,
					i;

				if (hash != null) {
					url += this.sep + this.strip_hash(hash);
				}

				if (replace) {
					window.history.replaceState({}, "", url);
				}
				else {
					window.history.pushState({}, "", url);
				}

				// Trigger
				trigger.call(this, "change", {
					init: false,
					pop: false,
				});
			},

			on: function (event, callback) {
				if (event in this.events) {
					this.events[event].push(callback);
					return true;
				}
				return false;
			},
			off: function (event, callback) {
				if (event in this.events) {
					var callbacks = this.events[event],
						i;

					for (i = 0; i < callbacks.length; ++i) {
						if (callbacks[i] == callback) {
							callbacks.splice(i, 1);
							return true;
						}
					}
				}
				return false;
			},

		};



		return HashNavigation;

	})();



	// Functions
	var nav = new HashNavigation();

	var rgb_to_hsv = function (r, g, b, floor) {
		var max_hue = 256 * 6,
			m1, m2, hue, sat, val;

		// Calculate which colors are the min/max; gets value, part of saturation
		if (r > g) {
			// r > g
			if (r > b) {
				// r > (g,b)
				val = r;
				if (g > b) {
					// r > g > b
					sat = val - b;
				}
				else {
					// r > b > g
					sat = val - g;
				}
				m1 = g - b;
				m2 = 6;
			}
			else {
				// b > r > g
				val = b;
				sat = val - g;
				m1 = r - g;
				m2 = 4;
			}
		}
		else {
			// g > r
			if (g > b) {
				// g > (b,r)
				val = g;
				if (b > r) {
					// g > b > r
					sat = val - r;
				}
				else {
					// g > r > b
					sat = val - b;
				}
				m1 = b - r;
				m2 = 2;
			}
			else {
				// b > g > r
				val = b;
				sat = val - r;
				m1 = r - g;
				m2 = 4;
			}
		}

		// Calculate hue and saturation
		if (val == 0) {
			sat = 0;
			hue = 0;
		}
		else {
			if (sat == 0) {
				hue = 0;
			}
			else {
				hue = (max_hue * (m2 * sat + m1)) / (6 * sat);
				if (hue >= max_hue) hue -= max_hue;

				sat = (255 * sat) / val;

				if (floor) {
					hue = Math.floor(hue);
					sat = Math.floor(sat);
				}
			}
		}

		// Done
		return [ hue , sat , val ];
	};

	var restyle_noscript = function () {
		// Script
		var nodes = document.querySelectorAll(".script_disabled"),
			i;

		for (i = 0; i < nodes.length; ++i) {
			nodes[i].classList.remove("script_visible");
		}

		nodes = document.querySelectorAll(".script_enabled");
		for (i = 0; i < nodes.length; ++i) {
			nodes[i].classList.add("script_visible");
		}
	};

	var rice_checkboxes = function (nodes) {
		var nodes = nodes || document.querySelectorAll("input[type=checkbox].checkbox"),
			svgns = "http://www.w3.org/2000/svg",
			i, par, sib, node, n1, n2, n3;

		for (i = 0; i < nodes.length; ++i) {
			node = nodes[i];
			par = node.parentNode;
			sib = node.nextSibling;

			// Create new checkbox
			n1 = document.createElement("label");
			n1.className = node.className;

			n2 = document.createElementNS(svgns, "svg");
			n2.setAttribute("svgns", svgns);
			n2.setAttribute("viewBox", "0 0 16 16");

			n3 = document.createElementNS(svgns, "polygon");
			n3.setAttribute("points", "13,0 16,2 8,16 5,16 0,11 2,8 6,11.5");

			// Re-add
			n2.appendChild(n3);
			n1.appendChild(n2);
			par.insertBefore(n1, node);
			n1.insertBefore(node, n2);
		}
	};
	var rice_radiobuttons = function (nodes) {
		var nodes = nodes || document.querySelectorAll("input[type=radio].radio"),
			i, par, sib, node, n1, n2, n3;

		for (i = 0; i < nodes.length; ++i) {
			node = nodes[i];
			par = node.parentNode;
			sib = node.nextSibling;

			// Create new radio
			n1 = document.createElement("label");
			n1.className = node.className;

			n2 = document.createElement("div");
			n3 = document.createElement("span");

			// Re-add
			n1.appendChild(n2);
			n1.appendChild(n3);
			par.insertBefore(n1, node);
			n1.insertBefore(node, n2);
		}
	};

	var get_region_tags = function (region) {
		var tags = region.querySelectorAll(".region_description_tags>.region_description_tag"),
			region_tags = [],
			tag, tag_name, i, j;

		for (i = 0; i < tags.length; ++i) {
			tag_name = get_region_tag_text(tags[i]);
			if (tag_name !== null) {
				region_tags.push([ tag_name , tags[i] ]);
			}
		}

		return region_tags; // returns an array of [ tag_string , tag_node ]
	};
	var get_region_tag_text = function (region_tag) {
		var tag = region_tag.querySelector("span");
		if (tag === null) return null;

		return (tag.textContent || "").trim().toLowerCase();
	};
	var get_region_name = function (region) {
		var node = region.querySelector(".region_title>a>span");

		if (node === null) return "";
		return node.textContent;
	};
	var get_region_color = function (region) {
		var node = region.querySelector(".color_indicator"),
			color = [ 0 , 0 , 0 , 0 ];

		if (node === null) return color;

		var html_color = window.getComputedStyle(node).borderLeftColor || "",
			re_pattern = /^rgba?\(\s*([0-9]+)\s*,\s*([0-9]+)\s*,\s*([0-9]+)\s*(?:,\s*([0-9\.]+)\s*)?\)$/i,
			match = re_pattern.exec(html_color);

		if (match) {
			color[0] = parseInt(match[1], 10);
			color[1] = parseInt(match[2], 10);
			color[2] = parseInt(match[3], 10);
			color[3] = match[4] ? parseFloat(match[4]) : 1;
		}

		return color;
	};

	var tags_setup = function () {
		var regions = document.querySelectorAll(".region"),
			c1 = document.querySelector(".settings_tags_container"),
			tag_data = {},
			region_tags, tag_data_array, c2, n1, n2, n3, tags, tag, tag_name, i, j;

		// Nothing to put it in
		if (c1 === null || (c2 = c1.querySelector(".settings_tags")) === null) return;

		// Count
		for (i = 0; i < regions.length; ++i) {
			region_tags = get_region_tags(regions[i]);
			for (j = 0; j < region_tags.length; ++j) {
				tag = region_tags[j][0];
				if (tag in tag_data) ++tag_data[tag];
				else tag_data[tag] = 1;

				// Event
				region_tags[j][1].addEventListener("click", on_region_tag_click, false);
			}
		}

		// Sort keys
		tag_data_array = [];
		for (i in tag_data) tag_data_array.push(i);
		if (tag_data_array.length == 0) return; // Nothing to do
		tag_data_array.sort();

		// Add tags
		for (i = 0; i < tag_data_array.length; ++i) {
			// Generate
			n1 = document.createElement("a");
			n1.className = "settings_tag rainbow_underline rainbow_underline_inside";
			n1.setAttribute("data-tag-name", tag_data_array[i]);
			n1.setAttribute("data-tag-count", tag_data[tag_data_array[i]]);

			n2 = document.createElement("span");
			n2.className = "rainbow_underline_inner";

			n3 = document.createElement("span");
			n3.className = "settings_tag_text";
			n3.textContent = tag_data_array[i];

			n2.appendChild(n3);
			n1.appendChild(n2);


			n2 = document.createElement("span");
			n2.className = "settings_tag_count";
			n2.textContent = "(" + tag_data[tag_data_array[i]] + ")";
			n1.appendChild(n2);

			// Events
			n1.addEventListener("click", on_tag_click, false);

			// Add
			c2.appendChild(n1);
		}

		// Visible
		c1.classList.add("settings_tags_container_visible");
	};
	var on_tag_click = function (event) {
		if (event.which && event.which != 1) return;

		// Selection change
		if (this.classList.contains("settings_tag_selected")) {
			this.classList.remove("settings_tag_selected");
		}
		else {
			this.classList.add("settings_tag_selected");
		}

		// Update URL
		update_url_hash();
	};
	var on_region_tag_click = function (event) {
		var is_selected = this.classList.contains("region_description_tag_selected"),
			tag_name = get_region_tag_text(this);

		if (tag_name === null) return;

		set_show_tags(true);
		set_selected_tags([ tag_name ], true, is_selected);

		// Update URL
		update_url_hash();
	};

	var on_sort_by_change = function (event) {
	};
	var on_sort_by_change = function (event) {
		if (!this.checked) return; // ignore

		update_url_hash();
	};
	var on_sort_by_tags_change = function (event) {
		update_url_hash();
	};

	var update_url_hash = function () {
		var vars = [],
			sort_by = get_sort_by(),
			tags, arr;

		if (sort_by && !sort_by[1]) {
			// Only show if not default
			vars.push([ "sort-by" , sort_by[0] ]);
		}

		if (get_show_tags()) {
			arr = [ "tags" ];
			tags = get_selected_tags();
			if (tags.length > 0) {
				arr.push(tags.join(","));
			}
			vars.push(arr);
		}

		nav.go(nav.encode_vars(vars, false) || null);
	};

	var get_sort_by = function () {
		var node = document.querySelector("input.settings_sort_by:checked");
		if (node === null) return null;

		return [ node.value , (node.getAttribute("data-is-default") == "true") ];
	};
	var set_sort_by = function (mode, update_sort) {
		var nodes = document.querySelectorAll("input.settings_sort_by"),
			node_default = null,
			updated = null,
			sort_array, container, i, val;

		for (i = 0; i < nodes.length; ++i) {
			if (nodes[i].value === mode) {
				nodes[i].checked = true;
				updated = nodes[i];
			}
			if (node_default === null && nodes[i].getAttribute("data-is-default") == "true") {
				node_default = nodes[i];
			}
		}

		// Default
		if (node_default !== null && updated === null) {
			node_default.checked = true;
			mode = node_default.value;
			updated = node_default;
		}

		// Update sorting
		if (!update_sort) return;
		container = document.querySelector(".region_container");
		if (container === null) return;
		nodes = container.querySelectorAll(".region");
		sort_array = [];

		if (mode == "color") {
			for (i = 0; i < nodes.length; ++i) {
				if (nodes[i].parentNode === container) {
					val = get_region_color(nodes[i]);
					val = rgb_to_hsv(val[0], val[1], val[2])[0];
					sort_array.push([ nodes[i] , val ]);
				}
			}
		}
		else { // if (mode == "name") {
			for (i = 0; i < nodes.length; ++i) {
				if (nodes[i].parentNode === container) {
					val = get_region_name(nodes[i]);
					sort_array.push([ nodes[i] , val ]);
				}
			}
		}

		sort_array.sort(function (r1, r2) {
			if (r1[1] < r2[1]) return -1;
			if (r1[1] > r2[1]) return 1;
			return 0;
		});

		// Add
		for (i = 0; i < sort_array.length; ++i) {
			container.appendChild(sort_array[i][0]);
		}
	};
	var get_show_tags = function () {
		var n = document.querySelector("input.settings_sort_by_tags");
		return (n !== null && n.checked);
	};
	var set_show_tags = function (show) {
		var n = document.querySelector("input.settings_sort_by_tags");
		if (n !== null) n.checked = show;

		// Display update
		n = document.querySelector(".settings_tags_container");
		if (n !== null) {
			if (show) {
				n.classList.add("settings_tags_container_enabled");
			}
			else {
				n.classList.remove("settings_tags_container_enabled");
			}
		}
	};
	var get_selected_tags = function () {
		var tags = document.querySelectorAll(".settings_tags>.settings_tag.settings_tag_selected"),
			tag_selection = {},
			tag_array = [],
			tag_name, i;

		for (i = 0; i < tags.length; ++i) {
			tag_name = (tags[i].getAttribute("data-tag-name") || "");
			tag_selection[tag_name] = true;
		}

		for (i in tag_selection) {
			tag_array.push(i);
		}
		tag_array.sort();

		return tag_array;
	};
	var set_selected_tags = function (tag_array, additive, subtractive) {
		// additive: tags that are already on will not be turned off if they aren't in tag_array
		// subtractive: tag_array will be turned off instead of on
		var tags = document.querySelectorAll(".settings_tags>.settings_tag"),
			selected_count = 0,
			tag_name, i, j, k, regions, tag_matches;

		for (i = 0; i < tags.length; ++i) {
			tag_name = (tags[i].getAttribute("data-tag-name") || "");

			if ((j = tag_array.indexOf(tag_name)) >= 0) {
				if (subtractive) {
					tags[i].classList.remove("settings_tag_selected");
					tag_array.splice(j, 1);
				}
				else {
					tags[i].classList.add("settings_tag_selected");
					++selected_count;
				}
			}
			else {
				if (additive) {
					if (tags[i].classList.contains("settings_tag_selected")) {
						tag_array.push(tag_name);
						++selected_count;
					}
				}
				else {
					tags[i].classList.remove("settings_tag_selected");
				}
			}
		}

		// Show/hide regions
		regions = document.querySelectorAll(".region");

		for (i = 0; i < regions.length; ++i) {
			// Find tags
			tags = get_region_tags(regions[i]);
			tag_matches = 0;

			// Find tag matches
			for (j = 0; j < tags.length; ++j) {
				if (tag_array.indexOf(tags[j][0]) >= 0) {
					tags[j][1].classList.add("region_description_tag_selected");
					++tag_matches;
				}
				else {
					tags[j][1].classList.remove("region_description_tag_selected");
				}
			}

			// Update region display
			if (tag_matches == 0 && selected_count > 0) {
				regions[i].classList.add("region_filtered_out_by_tags");
			}
			else {
				regions[i].classList.remove("region_filtered_out_by_tags");
			}
		}

	};

	var on_navigation_change = function (event) {
		var vars = this.decode_vars(this.strip_hash(this.get_url_parts(window.location.href).hash), true),
			sort_by = null,
			show_tags, tags;

		// Get values
		show_tags = ("tags" in vars);
		if ("sort-by" in vars) {
			sort_by = vars["sort-by"];
		}

		// Update display
		set_show_tags(show_tags);
		if (show_tags) {
			tags = vars["tags"];
			tags = tags ? tags.split(",") : [];
		}
		else {
			tags = [];
		}
		set_selected_tags(tags, false, false);
		sort_by = set_sort_by(sort_by, true);
	};



	// Execute
	ASAP.asap(function () {
		// Style
		restyle_noscript();
		rice_checkboxes();
		rice_radiobuttons();

		// Setup tags
		tags_setup();

		// Events
		var n, i;

		if ((n = document.querySelector("input.settings_sort_by_tags")) !== null) {
			n.addEventListener("change", on_sort_by_tags_change, false);
		}

		n = document.querySelectorAll("input.settings_sort_by");
		for (i = 0; i < n.length; ++i) {
			n[i].addEventListener("change", on_sort_by_change, false);
		}

		// Nav
		nav.on("change", on_navigation_change);
		nav.setup();
	});

})();


