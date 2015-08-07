(function () {
	"use strict";

	// Noscript test
	var re_noscript = /#!?no[ _-]?script$/i;
	if (re_noscript.test(window.location.href)) return;

	// Function for performing actions as soon as possible
	var on_ready = (function () {

		// Vars
		var callbacks = [],
			check_interval = null,
			check_interval_time = 250;

		// Check if ready and run callbacks
		var callback_check = function () {
			if (
				(document.readyState === "interactive" || document.readyState === "complete") &&
				callbacks !== null
			) {
				// Run callbacks
				var cbs = callbacks,
					cb_count = cbs.length,
					i;

				// Clear
				callbacks = null;

				for (i = 0; i < cb_count; ++i) {
					cbs[i].call(null);
				}

				// Clear events and checking interval
				window.removeEventListener("load", callback_check, false);
				window.removeEventListener("readystatechange", callback_check, false);

				if (check_interval !== null) {
					clearInterval(check_interval);
					check_interval = null;
				}

				// Okay
				return true;
			}

			// Not executed
			return false;
		};

		// Listen
		window.addEventListener("load", callback_check, false);
		window.addEventListener("readystatechange", callback_check, false);

		// Callback adding function
		return function (cb) {
			if (callbacks === null) {
				// Ready to execute
				cb.call(null);
			}
			else {
				// Delay
				callbacks.push(cb);

				// Set a check interval
				if (check_interval === null && callback_check() !== true) {
					check_interval = setInterval(callback_check, check_interval_time);
				}
			}
		};

	})();

	// Callback binding function
	var bind = function (callback, self) {
		if (arguments.length > 2) {
			var slice = Array.prototype.slice,
				push = Array.prototype.push,
				args = slice.call(arguments, 2);

			return function () {
				var full_args = slice.call(args);
				push.apply(full_args, arguments);

				return callback.apply(self, full_args);
			};
		}
		else {
			return function () {
				return callback.apply(self, arguments);
			};
		}
	};

	// Timing function
	var timing = (function () {
		var perf, now;

		if (
			(perf = window.performance) &&
			(now = perf.now || perf.mozNow || perf.msNow || perf.oNow || perf.webkitNow)
		) {
			return function () {
				return now.call(perf);
			};
		}
		else {
			perf = null;
			now = null;
			return function () {
				return new Date().getTime();
			};
		}
	})();

	// Scrolling disable
	var scrolling = (function () {

		var events = null,
			add_listener, remove_listener;

		if (window.addEventListener) {
			// Modern
			add_listener = function (node, event, callback) {
				node.addEventListener(event, callback, false);
				events.push([ node, event, callback ]);
			};
			remove_listener = function (node, event, callback) {
				node.removeEventListener(event, callback, false);
			};
		}
		else if (window.attachEvent) {
			// IE
			add_listener = function (node, event, callback) {
				node.attachEvent(event, callback);
			};
			remove_listener = function (node, event, callback) {
				node.detachEvent(event, callback);
			};
		}
		else {
			// Invalid
			return {
				disable: function () {},
				enable: function () {}
			};
		}

		// Event preventers
		var prevent_default = function (event) {
			if (!event) event = window.event;
			if (event.preventDefault) event.preventDefault();
			event.returnValue = false;
			return false;
		};
		var prevent_default_keys = function (event) {
			var k = event.which;

			if (
				(k >= 32 && event.which <= 40) || // arrows, space, home, end, pgup, pgdn
				k === 9 // tab
			) {
				return prevent_default.call(this, event);
			}
		};
		var prevent_default_mouse = function (event) {
			if (event.which) {
				if (event.which === 1 || event.which === 2) {
					return prevent_default.call(this, event);
				}
			}
			else {
				if ((event.button & (1|4)) !== 0) {
					return prevent_default.call(this, event);
				}
			}
		};

		// Functions
		return {
			disable: function () {
				if (events !== null) return;

				events = [];
				add_listener(window, "DOMMouseScroll", prevent_default);
				add_listener(window, "wheel", prevent_default);
				add_listener(document, "wheel", prevent_default);
				add_listener(window, "mousewheel", prevent_default);
				add_listener(document, "mousewheel", prevent_default);
				add_listener(window, "touchmove", prevent_default);
				add_listener(document, "mousedown", prevent_default_mouse);
				add_listener(document, "keydown", prevent_default_keys);
			},
			enable: function () {
				if (events === null) return;

				var i, e;
				for (i = 0; i < events.length; ++i) {
					e = events[i];
					remove_listener(e[0], e[1], e[2]);
				}

				events = null;
			}
		};

	})();

	// Window offset
	var get_window_offset = (function () {

		var win = window,
			doc_el = document.documentElement,
			fn;

		/*
		fn = function () {
			var r = doc_el.getBoundingClientRect();
			return [ -r.left, -r.top ];
		};
		fn.x = function () {
			return -doc_el.getBoundingClientRect().left;
		};
		fn.y = function () {
			return -doc_el.getBoundingClientRect().top;
		};
		return fn;
		*/

		// Detect
		if (doc_el.clientLeft === undefined) {
			if (win.pageXOffset !== undefined) {
				fn = function () { return [ win.pageXOffset, win.pageYOffset ]; };
				fn.x = function () { return win.pageXOffset; };
				fn.y = function () { return win.pageYOffset; };
				return fn;
			}
			else if (doc_el.scrollLeft !== undefined) {
				fn = function () { return [ win.scrollLeft, win.scrollTop ]; };
				fn.x = function () { return win.scrollLeft; };
				fn.y = function () { return win.scrollTop; };
				return fn;
			}
		}
		else {
			if (win.pageXOffset !== undefined) {
				fn = function () { return [ win.pageXOffset - doc_el.clientLeft, win.pageYOffset - doc_el.clientTop ]; };
				fn.x = function () { return win.pageXOffset - doc_el.clientLeft; };
				fn.y = function () { return win.pageYOffset - doc_el.clientTop; };
				return fn;
			}
			else if (doc_el.scrollLeft !== undefined) {
				fn = function () { return [ win.scrollLeft - doc_el.clientLeft, win.scrollTop - doc_el.clientTop ]; };
				fn.x = function () { return win.scrollLeft - doc_el.clientLeft; };
				fn.y = function () { return win.scrollTop - doc_el.clientTop; };
				return fn;
			}
		}

		// Invalid
		fn = function () { return [ 0, 0 ]; };
		fn.x = fn.y = function () { return 0; };
		return fn;

	})();
	var get_window_size = (function () {

		var win = window,
			doc_el = document.documentElement,
			fn;

		// Detect
		if (doc_el.clientWidth !== undefined) {
			fn = function () { return [ doc_el.clientWidth, doc_el.clientHeight ]; };
			fn.width = function () { return doc_el.clientWidth; };
			fn.height = function () { return doc_el.clientHeight; };
			return fn;
		}
		else if (win.innerWidth !== undefined) {
			fn = function () { return [ win.innerWidth, win.innerHeight ]; };
			fn.width = function () { return win.innerWidth; };
			fn.height = function () { return win.innerHeight; };
			return fn;
		}

		// Invalid
		fn = function () { return [ 0, 0 ]; };
		fn.width = fn.height = function () { return 0; };
		return fn;

	})();

	// Prefixed style
	var get_prefixed_style = function (name) {
		// Returns
		var e = document.createElement("div"),
			prefixes, prefixes2, name2, n, i;

		name2 = name.replace(/[A-Z]/g, function (match) {
			return "-" + match.toLowerCase();
		});
		name = name.replace(/-[a-z]/g, function (match) {
			return match[1].toUpperCase();
		});

		// Un-prefixed
		if (typeof(e.style[name]) === "string") {
			return [ name, name2 ];
		}

		// Check prefixes
		prefixes = [ "webkit" , "Moz" , "O" , "ms" ];
		prefixes2 = [ "-webkit-" , "-moz-" , "-o-" , "-ms-" ];
		name = name[0].toUpperCase() + name.substr(1);

		for (i = 0; i < prefixes.length; ++i) {
			n = prefixes[i] + name;
			if (typeof(e.style[n]) === "string") {
				return [ n, prefixes2[i] + name2 ];
			}
		}

		name = name[0].toLowerCase() + name.substr(1);
		return [ name, name2 ];
	};

	// Touch events
	var TouchHandler = (function () {

		var TouchData = function (parent) {
			this.x = 0;
			this.y = 0;
			this.x_start = 0;
			this.y_start = 0;
			this.x_last = 0;
			this.y_last = 0;
			this.x_last_speed = 0;
			this.y_last_speed = 0;
			this.x_speed = 0;
			this.y_speed = 0;
			this.speed_time_last = 0;
			this.speed_timer = null;
			this.win_left = 0;
			this.win_top = 0;
			this.radius = 16;
			this.radius_sq = this.radius * this.radius;

			this.parent = parent;
			this.on_touch_update_speed = bind(on_touch_update_speed, this);
		};
		var WatchData = function (node, event, callback, init_check) {
			this.node = node;
			this.event = event;
			this.callback = callback;
			this.init_check = init_check;
			this.data = {
				type: "",
				x: 0,
				y: 0,
				start: {
					x: 0,
					y: 0
				},
				speed: {
					x: 0,
					y: 0
				},
				speed_last_nonzero: {
					x: 0,
					y: 0
				}
			};
		};
		WatchData.prototype.reset = function () {
			this.data.start.x = 0;
			this.data.start.y = 0;
			this.data.speed.x = 0;
			this.data.speed.y = 0;
			this.data.speed_last_nonzero.x = 0;
			this.data.speed_last_nonzero.y = 0;
		};

		var TouchHandler = function () {
			// Touch events
			var n = document.body;
			n.addEventListener("touchmove", bind(on_touchmove, this), false);
			n.addEventListener("touchstart", bind(on_touchstart, this), false);
			n.addEventListener("touchend", bind(on_touchend, this), false);
			n.addEventListener("touchcancel", bind(on_touchcancel, this), false);
			window.addEventListener("scroll", bind(on_window_scroll, this), false);

			// Touch ids
			this.touch = new TouchData(this);
			this.ids = [];
			this.can_be_active = false;
			this.is_active = false;
			this.direction_x = false;
			this.watching = [];
			this.current_data = null;
		};

		var on_touchstart = function (event) {
			// Check to see if it's a valid object to touchstart on
			if (this.watching.length === 0) return;

			var i;

			if (this.ids.length === 0) {
				var w_data = null,
					j, t, w;

				for (i = 0; i < event.changedTouches.length; ++i) {
					t = event.changedTouches[i].target;
					for (j = 0; j < this.watching.length; ++j) {
						w = this.watching[j];
						if (
							(w.node === null || this.node_contains(w.node, t)) &&
							(w.init_check === null || w.init_check.call(null, t))
						) {
							w_data = w;
							break;
						}
					}
				}

				// Not valid
				if (w_data === null) return;
				this.current_data = w_data;
				this.current_data.reset();

				// Ready
				this.can_be_active = true;
				update_touch_data_init.call(this.touch, event.changedTouches[0]);
			}

			for (i = 0; i < event.changedTouches.length; ++i) {
				this.ids.push(event.changedTouches[i].identifier);
			}
		};
		var on_touchend = function (event) {
			if (!this.can_be_active) return;

			var id_len = this.ids.length,
				touches = event.touches,
				changed_touches = event.changedTouches,
				changed_touches_len = changed_touches.length,
				update_pos = false,
				i, j, t, id;

			for (i = 0; i < changed_touches_len; ++i) {
				id = changed_touches[i].identifier;

				for (j = 0; j < id_len; ++j) {
					if (this.ids[j] === id) {
						// Remove
						this.ids.splice(j, 1);
						--id_len;

						// Original touch has changed
						if (j === 0) {
							if (this.ids.length === 0) {
								// No touches
								touch_complete.call(this);
								return;
							}
							else {
								// Now using new touch
								update_pos = true;
							}
						}
						break;
					}
				}
			}

			// Update position
			if (update_pos) {
				id = this.ids[0];
				for (j = 0; j < touches.length; ++j) {
					t = touches[j];
					if (t.identifier === id) {
						var data = this.current_data.data,
							dx = -this.touch.x_last,
							dy = -this.touch.y_last;

						update_touch_data.call(this.touch, t);
						update_touch_data_last.call(this.touch);

						dx += this.touch.x_last;
						dy += this.touch.y_last;

						data.start.x += dx;
						data.start.y += dy;
						this.touch.x_last_speed += dx;
						this.touch.y_last_speed += dy;
						break;
					}
				}
			}
		};
		var on_touchcancel = function () {
			this.ids = [];
			touch_complete.call(this);
		};
		var on_touchmove = function (event) {
			if (!this.can_be_active) return;

			var id = this.ids[0],
				e, i;

			for (i = 0; i < event.changedTouches.length; ++i) {
				e = event.changedTouches[i];
				if (e.identifier === id) {
					update_touch_data.call(this.touch, e);
					handle_touch_move.call(this);
					break;
				}
			}
		};
		var on_window_scroll = function () {
			if (this.can_be_active) {
				this.touch.win_left = get_window_offset.x();
				this.touch.win_top = get_window_offset.y();
				handle_touch_move.call(this);
			}
		};

		var node_contains_inner = function (test, node) {
			// Check parents
			while (true) {
				if (node === test) return true;
				node = node.parentNode;
				if (!node) return false;
			}
		};
		var touch_complete = function () {
			if (this.is_active) {
				trigger.call(this, "end");
			}

			this.can_be_active = false;
			this.is_active = false;
			this.current_data = null;

			if (this.touch.speed_timer !== null) {
				clearInterval(this.touch.speed_timer);
				this.touch.speed_timer = null;
			}
			scrolling.enable();
		};
		var update_touch_data_init = function (touch) {
			scrolling.disable();
			this.x_speed = 0;
			this.y_speed = 0;
			this.x_speed_temp = 0;
			this.y_speed_temp = 0;
			this.x = touch.clientX;
			this.y = touch.clientY;
			this.win_left = get_window_offset.x();
			this.win_top = get_window_offset.y();
			this.x_start = this.x + this.win_left;
			this.y_start = this.y + this.win_top;
			this.x_last_speed = this.x_start;
			this.y_last_speed = this.y_start;
			this.speed_time_last = timing();
			this.speed_timer = setInterval(this.on_touch_update_speed, 50);
		};
		var update_touch_data = function (touch) {
			this.x = touch.clientX;
			this.y = touch.clientY;
		};
		var update_touch_data_last = function () {
			this.x_last = this.x + this.win_left;
			this.y_last = this.y + this.win_top;
		};
		var handle_touch_move = function () {
			if (!this.can_be_active) return;

			var x = this.touch.x + this.touch.win_left,
				y = this.touch.y + this.touch.win_top,
				dx, dy, dist;

			if (x === this.touch.x_last && y === this.touch.y_last) return;

			this.current_data.data.x = x;
			this.current_data.data.y = y;

			if (!this.is_active) {
				// Distance
				dx = x - this.touch.x_start;
				dy = y - this.touch.y_start;
				dist = dx * dx + dy * dy;

				// State checking
				if (dist < this.touch.radius_sq) {
					update_touch_data_last.call(this.touch);
					return;
				}
				if (!check_event_start_valid.call(this, dx, dy)) {
					trigger.call(this, "cancel");
					this.ids = [];
					touch_complete.call(this);
					return;
				}
				else {
					dist = Math.sqrt(dist) / this.touch.radius;
					this.current_data.data.start.x = this.touch.x_start + dx / dist; // Normalized to be on the radius of the touch;
					this.current_data.data.start.y = this.touch.x_start + dy / dist; // useful in case of very low poll rate
					if (trigger.call(this, "begin") === false) {
						this.ids = [];
						touch_complete.call(this);
						return;
					}
					this.is_active = true;
				}
			}

			// Update
			trigger.call(this, "move");

			// Update last
			update_touch_data_last.call(this.touch);
		};
		var on_touch_update_speed = function () {
			var dt = timing(),
				dx = this.x_last - this.x_last_speed,
				dy = this.y_last - this.y_last_speed,
				t = this.speed_time_last,
				d = this.parent.current_data.data,
				s;

			this.speed_time_last = dt;
			this.x_last_speed = this.x_last;
			this.y_last_speed = this.y_last;

			dt -= t;
			dt /= 1000;
			dx /= dt;
			dy /= dt;

			this.x_speed = dx;
			this.y_speed = dy;

			s = d.speed;
			s.x = dx;
			s.y = dy;

			if (dx !== 0 || dy !== 0) {
				s = d.speed_last_nonzero;
				s.x = dx;
				s.y = dy;
			}
		};
		var check_event_start_valid = function (dx, dy) {
			if (this.current_data.event === "swipe") {
				this.direction_x = (Math.abs(dx) >= Math.abs(dy));
				return true;
			}
			else if (this.current_data.event === "swipex") {
				if (dx !== 0 && Math.abs(dy / dx) <= swipe_angle_threshold) {
					this.direction_x = true;
					return true;
				}
			}
			else if (this.current_data.event === "swipey") {
				if (dy !== 0 && Math.abs(dx / dy) <= swipe_angle_threshold) {
					this.direction_x = false;
					return true;
				}
			}

			return false;
		};
		var trigger = function (type) {
			this.current_data.data.type = type;
			return this.current_data.callback.call(null, this.current_data.data);
		};

		var swipe_angle_threshold = 1.0 / 2.0;
		var events = {
			"swipe": true,
			"swipex": true,
			"swipey": true,
		};



		TouchHandler.prototype = {
			constructor: TouchHandler,

			on: function (node, event, handler, init_check) {
				if (!(event in events)) return false;

				this.watching.push(new WatchData(node, event, handler, init_check || null));
				return true;
			},
			off: function (node, event, handler, init_check) {
				if (!init_check) init_check = null;

				var i, w;
				for (i = 0; i < this.watching.length; ++i) {
					w = this.watching[i];
					if (
						w.node === node &&
						w.event === event &&
						w.handler === handler &&
						w.init_check === init_check
					) {
						if (w === this.current_data) {
							touch_complete.call(this);
						}

						this.watching.splice(i, 1);
						return true;
					}
				}
				return false;
			},
			node_contains: function (test, node) {
				try {
					return node_contains_inner(test, node);
				}
				catch (e) {
					return false;
				}
			},

		};



		return TouchHandler;

	})();

	// Content scroll handler
	var ContentHandler = (function () {

		var ContentHandler = function (touch_handler) {
			this.enabled = false;

			this.touch_handler = touch_handler;
			this.no_swipes = document.querySelectorAll(".no_swipe");
			this.contents = document.querySelector(".contents");

			this.content_nodes = [ null, null, null ];
			this.content_rects = [ null, null, null ];
			this.drag_offset = 0;
			this.transitioning = false;
			this.transition_complete_class_removals = [];

			var ote = bind(on_contents_transitionend, this);
			this.contents.addEventListener("transitionend", ote, false);
			this.contents.addEventListener("webkitTransitionEnd", ote, false);
			this.contents.addEventListener("oTransitionEnd", ote, false);
			this.contents.addEventListener("otransitionend", ote, false);
			this.transition_end_timer = null;
			window.addEventListener("resize", bind(on_window_resize, this), false);
			this.touch_handler.on(null, "swipex", bind(on_swipex, this), bind(on_touch_filter, this));

			// Indicator settings
			this.indicator_container = document.querySelector(".content_nav_header");
			this.indicator_buttons = get_indicator_buttons.call(this);
			this.indicator_bar = this.indicator_container.querySelector(".content_nav_indicator");
			this.indicator_container_size = null;
			this.indicator_button_sizes = null;
			this.indicator_current = 0;

			// Media query
			var mq = window.matchMedia("screen and (max-width: 640px)");
			if (mq.matches) enable.call(this, false);
			mq.addListener(bind(on_mobile_change, this));
		};

		var css_transform = get_prefixed_style("transform");
		var css_transform2 = css_transform[1];
		css_transform = css_transform[0];
		var css_transition = get_prefixed_style("transition")[0];
		var bounce_bezier = (function () {
			var temp = document.createElement("div"),
				timing = get_prefixed_style("transitionTimingFunction")[0],
				b = "cubic-bezier(0.45,-0.45,0.65,1)";

			temp.style[timing] = b;
			return (temp.style[timing] ? b : "cubic-bezier(0.45,0,0.65,1)");
		})();



		var on_swipex = function (event) {
			if (!this.enabled) return true;

			var t = event.type;
			if (t === "begin") {
				return on_swipex_begin.call(this, event);
			}
			else if (t === "end") {
				on_swipex_end.call(this, event);
			}
			else if (t === "move") {
				on_swipex_move.call(this, event);
			}
			return true;
		};
		var on_touch_filter = function (node) {
			if (!this.enabled) return false;

			for (var i = 0; i < this.no_swipes.length; ++i) {
				if (this.touch_handler.node_contains(this.no_swipes[i], node)) return false;
			}
			return true;
		};
		var on_swipex_begin = function () {
			this.content_nodes[1] = this.contents.querySelector(".content.content_main");
			// Invalid
			if (this.content_nodes[1] === null) return false;

			this.content_nodes[0] = get_previous_sibling_node(this.content_nodes[1]);
			this.content_nodes[2] = get_next_sibling_node(this.content_nodes[1]);
			// Invalid
			if (this.content_nodes[0] === null && this.content_nodes[2] === null) return false;

			// Setup
			if (this.transitioning) complete_transition.call(this);
			this.contents.classList.add("contents_dragging");

			this.content_rects[1] = this.content_nodes[1].getBoundingClientRect();
			if (this.content_nodes[0] !== null) setup_node_rect_etc.call(this, 0, "content_before");
			if (this.content_nodes[2] !== null) setup_node_rect_etc.call(this, 2, "content_after");

			this.contents.style[css_transition] = "";
			window.getComputedStyle(this.contents).getPropertyValue(css_transform);

			// Ready
			return true;
		};
		var on_swipex_end = function (event) {
			// Stop dragging
			this.contents.classList.remove("contents_dragging");

			// Detect any changes
			var go_to_relative = 0,
				reverse = false,
				timing;

			if (this.content_nodes[2] !== null) {
				this.transition_complete_class_removals.push([ this.content_nodes[2], "content_after" ]);

				if (
					event.speed.x <= -800 ||
					((reverse = this.drag_offset <= this.content_rects[1].width / -3) && event.speed_last_nonzero.x < 0)
				) {
					go_to_relative = 1;
				}
			}
			if (this.content_nodes[0] !== null) {
				this.transition_complete_class_removals.push([ this.content_nodes[0], "content_before" ]);

				if (go_to_relative === 0) {
					if (
						event.speed.x >= 800 ||
						((reverse = this.drag_offset >= this.content_rects[1].width / 3) && event.speed_last_nonzero.x > 0)
					) {
						go_to_relative = -1;
					}
				}
			}

			if (go_to_relative === 0) {
				// Return
				timing = (Math.abs(event.speed.x) > 100) ? (reverse ? "ease-out" : bounce_bezier) : "ease-in-out";

				if (this.drag_offset === 0) {
					complete_transition.call(this);
				}
				else {
					this.contents.style[css_transition] = css_transform2 + " " + animation_time + "s " + timing + " 0s";
					this.contents.style[css_transform] = "translate(0,0)";
					begin_transition.call(this);
				}

				// Reset indicator
				set_indicator_position.call(this, this.indicator_current, true);
			}
			else {
				// Go to new
				go_to.call(this,
					this.content_nodes[1 + go_to_relative],
					this.content_nodes[1],
					(Math.abs(event.speed.x) > 100),
					go_to_relative,
					this.drag_offset + this.content_rects[1].width * go_to_relative,
					true,
					true
				);
			}
		};
		var on_swipex_move = function (event) {
			// Dragging offset
			this.drag_offset = event.x - event.start.x;

			var limit = (this.content_nodes[2] === null ? 0 : -this.content_rects[1].width);
			if (this.drag_offset < limit) {
				this.drag_offset = limit;
			}
			else {
				limit = (this.content_nodes[0] === null ? 0 : this.content_rects[1].width);
				if (this.drag_offset > limit) this.drag_offset = limit;
			}

			// Transform
			this.contents.style[css_transform] = "translate(" + this.drag_offset + "px,0)";
		};
		var on_contents_transitionend = function (event) {
			if (event.propertyName === css_transform2) {
				complete_transition.call(this);
			}
		};
		var on_contents_transitionend_fallback = function () {
			this.transition_end_timer = null;
			complete_transition.call(this);
		};
		var on_mobile_change = function (event) {
			if (event.matches) {
				enable.call(this, true);
			}
			else {
				disable.call(this);
			}
		};
		var on_window_resize = function () {
			if (this.enabled) {
				update_indicator.call(this);
			}
		};
		var on_section_change = function (index, event) {
			if (event.which === 1) {
				go_to_index.call(this, index, true, true);
			}
		};

		var setup_node_rect_etc = function (index, cls) {
			var n = this.content_nodes[index],
				scroll, scroll_range, r, y;

			// Setup
			n.classList.add(cls);
			n.style[css_transform] = "";
			r = n.getBoundingClientRect();
			this.content_rects[index] = r;

			// Scroll translation value
			if (this.content_rects[1].top > 0) {
				y = 0;
				n.setAttribute("data-scroll", "0");
			}
			else {
				scroll = parseFloat(n.getAttribute("data-scroll")) || 0;
				scroll_range = r.height - get_window_size.height();
				if (scroll_range < 0) scroll_range = 0;

				y = -(r.top + scroll * scroll_range);
			}
			n.style[css_transform] = "translate(0," + y + "px)";
		};
		var begin_transition = function () {
			this.transitioning = true;
			if (this.transition_end_timer !== null) {
				clearTimeout(this.transition_end_timer);
			}
			this.transition_end_timer = setTimeout(bind(on_contents_transitionend_fallback, this), animation_time * 1000);
		};
		var complete_transition = function () {
			if (this.transition_end_timer !== null) {
				clearTimeout(this.transition_end_timer);
				this.transition_end_timer = null;
			}

			var i, r;
			for (i = 0; i < this.transition_complete_class_removals.length; ++i) {
				r = this.transition_complete_class_removals[i];
				r[0].classList.remove(r[1]);
			}

			this.transitioning = false;
			this.transition_complete_class_removals = [];
		};
		var get_previous_sibling_node = function (node) {
			while (true) {
				node = node.previousSibling;
				if (node === null || node.tagName !== undefined) return node;
			}
		};
		var get_next_sibling_node = function (node) {
			while (true) {
				node = node.nextSibling;
				if (node === null || node.tagName !== undefined) return node;
			}
		};
		var get_scroll_percent = function (node) {
			var rect = node.getBoundingClientRect(),
				y = -rect.top,
				h = rect.height - get_window_size.height();

			return (h <= 0 || y < 0) ? 0 : y / h;
		};
		var disable = function () {
			var i, n, ns;

			this.enabled = false;

			for (i = 0; i < this.content_nodes.length; ++i) {
				this.content_nodes[i] = null;
				this.content_rects[i] = null;
			}

			this.contents.style[css_transition] = "";
			this.contents.style[css_transform] = "";

			ns = this.contents.querySelectorAll(".content");
			for (i = 0; i < ns.length; ++i) {
				n = ns[i];
				n.style[css_transform] = "";
				n.classList.remove("content_before");
				n.classList.remove("content_after");
				n.setAttribute("data-scroll", "0");
			}

			window.getComputedStyle(this.contents).getPropertyValue(css_transform);

			update_url_hash(false);
		};
		var enable = function (update_url) {
			this.enabled = true;

			this.indicator_current = find_current_indicator_index.call(this);
			update_indicator.call(this);

			if (update_url) update_url_hash(false);
		};
		var go_to_index = function (index, animate, update_url) {
			if (!this.enabled || index === this.indicator_current) return;

			var n = this.contents.querySelectorAll(".content"),
				direction = 1,
				c, r, sib;

			if (
				index < n.length &&
				(c = this.contents.querySelector(".content.content_main")) !== null
			) {
				n = n[index];
				r = c.getBoundingClientRect();
				for (sib = n.nextSibling; sib !== null; sib = sib.nextSibling) {
					if (sib === c) {
						direction = -1;
						break;
					}
				}
				go_to.call(this, n, c, false, direction, r.width * direction, animate, update_url);
			}
		};
		var go_to = function (node, current, speed_is_large, direction, offset, animate, update_url) {
			if (!this.enabled) return;

			var timing = (speed_is_large ? "ease-out" : "ease-in-out"),
				win_top = get_window_offset.y(),
				scroll, scroll_range, c, p, r, t, y;

			// Reset transition
			complete_transition.call(this);
			if (!animate) offset = 0;
			this.contents.style[css_transform] = "translate(" + offset + "px,0)";
			this.contents.style[css_transition] = "none";
			window.getComputedStyle(this.contents).getPropertyValue(css_transform);
			this.contents.style[css_transform] = "translate(0,0)";
			this.contents.style[css_transition] = css_transform2 + " " + animation_time + "s " + timing + " 0s";

			// Update scroll
			p = get_scroll_percent(current);
			current.setAttribute("data-scroll", p.toString());

			// Update stylings
			current.classList.remove("content_main");
			node.classList.add("content_main");
			node.classList.remove("content_before");
			node.classList.remove("content_after");
			node.style[css_transform] = "";


			// Transition
			r = node.getBoundingClientRect();

			// New scroll target
			if (r.top <= 0) {
				y = get_window_offset.y() + r.top;
				scroll_range = r.height - get_window_size.height();
				if (scroll_range > 0) {
					scroll = parseFloat(node.getAttribute("data-scroll")) || 0;
					y += scroll * scroll_range;
				}

				document.documentElement.scrollTop = y;
				document.body.scrollTop = y;

				// Errors due to rounding
				t = node.getBoundingClientRect().top;
				if (t > 0) {
					y += Math.ceil(t);
					document.documentElement.scrollTop = y;
					document.body.scrollTop = y;
				}
			}

			if (offset !== 0) {
				y = (r.top > 0 ? 0 : get_window_offset.y() - win_top);

				c = (direction > 0 ? "content_before" : "content_after");
				current.classList.add(c);
				current.style[css_transform] = "translate(0," + y + "px)";

				this.transition_complete_class_removals.push([ current, c ]);
				begin_transition.call(this);
			}

			set_indicator_position.call(this, get_content_index.call(this, node, node.parentNode), animate);

			if (update_url) update_url_hash(false);
		};

		var update_indicator = function () {
			this.indicator_container_size = this.indicator_container.getBoundingClientRect();
			this.indicator_button_sizes = [];

			for (var i = 0; i < this.indicator_buttons.length; ++i) {
				this.indicator_button_sizes.push(this.indicator_buttons[i].getBoundingClientRect());
			}

			set_indicator_position.call(this, this.indicator_current, false);
		};
		var set_indicator_position = function (index, animate) {
			var bs = this.indicator_button_sizes[index],
				cls = "content_nav_indicator_animating",
				cs;

			if (animate) {
				this.indicator_bar.classList.add(cls);
			}
			else {
				if (this.indicator_bar.classList.contains(cls)) {
					this.indicator_bar.classList.remove(cls);
					cs = window.getComputedStyle(this.contents);
					cs.getPropertyValue("left");
					cs.getPropertyValue("width");
				}
			}

			this.indicator_bar.style.left = ((bs.left - this.indicator_container_size.left) / this.indicator_container_size.width * 100).toFixed(5) + "%";
			this.indicator_bar.style.width = (bs.width / this.indicator_container_size.width * 100).toFixed(5) + "%";

			this.indicator_buttons[this.indicator_current].classList.remove("content_nav_text_selected");
			this.indicator_buttons[index].classList.add("content_nav_text_selected");

			this.indicator_current = index;
		};
		var get_content_index = function (node, parent) {
			var n, i;

			i = 0;
			for (n = parent.firstChild; n !== null; n = n.nextSibling) {
				if (n.tagName !== undefined) {
					if (n === node) return i;
					++i;
				}
			}

			return -1;
		};
		var find_current_indicator_index = function () {
			for (var i = 0; i < this.indicator_buttons.length; ++i) {
				if (this.indicator_buttons[i].classList.contains("content_nav_text_selected")) return i;
			}
			return 0;
		};
		var get_indicator_buttons = function () {
			var buttons = this.indicator_container.querySelectorAll(".content_nav_button"),
				i;

			for (i = 0; i < buttons.length; ++i) {
				buttons[i].addEventListener("click", bind(on_section_change, this, i), false);
			}

			return buttons;
		};

		var animation_time = 0.25;



		ContentHandler.prototype = {
			constructor: ContentHandler,

			go_to_content: function (label, animate) {
				var ns = this.contents.querySelectorAll(".content"),
					n, i;

				for (i = 0; i < ns.length; ++i) {
					n = ns[i];
					if (label === null) {
						if (n.getAttribute("data-is-default") === "true") {
							go_to_index.call(this, i, animate, false);
							return true;
						}
					}
					else if (n.getAttribute("data-content-id") === label) {
						go_to_index.call(this, i, animate, false);
						return true;
					}
				}

				return false;
			}
		};



		return ContentHandler;

	})();

	// URL fragment navigation
	var HashNavigation = (function () {

		var HashNavigation = function () {
			this.sep = "#!";

			this.events = {
				"change": [],
			};
		};



		var re_decode_var = /^(.*?)(?:=(.*))?$/,
			re_decode = /\+|%([0-9a-fA-F]{2})/g,
			re_encode = [ /[ %+&=]/g, /[ %+&]/g ],
			re_encode_map = {
				" ": "+",
				"%": "%25",
				"+": "%2b",
				"&": "%26",
				"=": "%3d"
			},
			re_decode_map = {
				"+": " "
			};

		var escape_var = function (str, index) {
			return str.replace(re_encode[index], function (match) {
				return re_encode_map[match];
			});
		};
		var unescape_var = function (str) {
			return str.replace(re_decode, function (match, hex) {
				if (hex === undefined) return re_decode_map[match];
				return String.fromCharCode(parseInt(hex, 16));
			});
		};

		var on_window_popstate = function () {
			// Trigger
			trigger.call(this, "change", {
				init: false,
				pop: true,
			});
		};

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

			strip_hash: function (hash) {
				var i;
				for (i = 0; i < this.sep.length; ++i) {
					if (hash[i] !== this.sep[i]) break;
				}
				return (i === 0 ? hash : hash.substr(i));
			},
			strip_search: function (search) {
				return (search[0] === "?") ? search.substr(1) : search;
			},

			encode_vars: function (vars) {
				var str = "",
					first = true,
					v;

				if (Array.isArray(vars)) {
					for (v = 0; v < vars.length; ++v) {
						if (v > 0) str += "&";

						str += escape_var(vars[v][0], 0);
						if (vars[v].length > 1) {
							str += "=";
							str += escape_var(vars[v][1], 1);
						}
					}
				}
				else {
					for (v in vars) {
						if (first) first = false;
						else str += "&";

						str += escape_var(v, 0);
						if (vars[v] !== null) {
							str += "=";
							str += escape_var(vars[v], 1);
						}
					}
				}

				return str;
			},
			decode_vars: function (str) {
				var vars = {},
					str_split = str.split("&"),
					match, i;

				for (i = 0; i < str_split.length; ++i) {
					// Get the match
					if (str_split[i].length === 0) continue;
					match = re_decode_var.exec(str_split[i]);

					// Set the var
					vars[unescape_var(match[1], 0)] = (match[2] === undefined ? null : unescape_var(match[2], 1));
				}

				// Return the vars
				return vars;
			},

			get_hash: function (url) {
				var i = url.indexOf("#");
				return (i < 0 ? "" : url.substr(i));
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
			go: function (hash, replace, no_event) {
				// Setup url
				var url = window.location.href,
					i = url.indexOf("#");

				if (i > 0) url = url.substr(0, i);

				if (hash !== null) {
					url += this.sep + this.strip_hash(hash);
				}

				try {
					if (replace) {
						window.history.replaceState(null, "", url);
					}
					else {
						window.history.pushState(null, "", url);
					}
				}
				catch (e) {
					// Because chrome is a really good browser
					if (hash === null) url += this.sep;
					window.location.href = url;
					return;
				}

				// Trigger
				if (!no_event) {
					trigger.call(this, "change", {
						init: false,
						pop: false,
					});
				}
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

	// Objects
	var nav = new HashNavigation(),
		touch_handler = null,
		content_handler = null;

	// Styling
	var restyle_noscript = function () {
		// Script
		var nodes = document.querySelectorAll(".script"),
			i;

		for (i = 0; i < nodes.length; ++i) {
			nodes[i].classList.add("script_enabled");
		}
	};
	var rice_checkboxes = function (nodes) {
		var doc = document,
			svgns = "http://www.w3.org/2000/svg",
			i, par, sib, node, n1, n2, n3;

		if (!nodes) nodes = doc.querySelectorAll("input[type=checkbox].checkbox");

		for (i = 0; i < nodes.length; ++i) {
			node = nodes[i];
			par = node.parentNode;
			sib = node.nextSibling;

			// Create new checkbox
			n1 = doc.createElement("label");
			n1.className = node.className;

			n2 = doc.createElementNS(svgns, "svg");
			n2.setAttribute("svgns", svgns);
			n2.setAttribute("viewBox", "0 0 16 16");

			n3 = doc.createElementNS(svgns, "polygon");
			n3.setAttribute("points", "13,0 16,2 8,16 5,16 0,11 2,8 6,11.5");

			// Re-add
			n2.appendChild(n3);
			n1.appendChild(n2);
			par.insertBefore(n1, node);
			n1.insertBefore(node, n2);
		}
	};
	var rice_radiobuttons = function (nodes) {
		var i, par, sib, node, n1, n2, n3;

		if (!nodes) nodes = document.querySelectorAll("input[type=radio].radio");

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

	var rgb_to_hsv = function (r, g, b) {
		var h = 0,
			s = 0,
			v = 0,
			diff,
			mult;

		if (r > g) {
			if (r > b) {
				// r > (g,b)
				v = r;
				if (b > g) {
					s = v - g;
					mult = 6;
				}
				else {
					s = v - b;
					mult = 0;
				}
				diff = g - b;
			}
			else {
				// b > r > g
				v = b;
				s = v - g;
				diff = r - g;
				mult = 4;
			}
		}
		else {
			if (g > b) {
				// g > (b,r)
				v = g;
				s = v - (b > r ? r : b);
				diff = b - r;
				mult = 2;
			}
			else {
				// b > g > r
				v = b;
				s = v - r;
				diff = r - g;
				mult = 4;
			}
		}

		if (v > 0 && s > 0) {
			h = ((mult * s + diff) / (6 * s));
			s /= v;
		}

		return [ h , s , v ];
	};

	var get_repository_container = function () {
		return document.querySelector(".repository_container");
	};
	var get_repositories = function () {
		return document.querySelectorAll(".repository_container>.repository");
	};
	var get_repository_tags = function (repository) {
		var tag_nodes = repository.querySelectorAll(".repository_tags>.repository_tag"),
			tags = [],
			tag_name, i;

		for (i = 0; i < tag_nodes.length; ++i) {
			tag_name = get_repository_tag_text(tag_nodes[i]);
			if (tag_name !== null) {
				tags.push([ tag_name , tag_nodes[i] ]);
			}
		}

		return tags; // returns an array of [ tag_string , tag_node ]
	};
	var get_repository_tag_text = function (tag) {
		tag = tag.querySelector("span");
		return (tag === null ? null : (tag.textContent || "").trim());
	};
	var get_repository_name = function (repository) {
		var node = repository.querySelector(".repository_name>span");
		return (node === null ? "" : node.textContent.trim());
	};
	var get_repository_color = function (repository) {
		var node = repository.querySelector(".repository_color_indicator") || repository,
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

	var repository_settings = {
		setup: function () {
			// Events
			var doc = document,
				n, i;

			if ((n = doc.querySelector("input.settings_sort_by_tags")) !== null) {
				n.addEventListener("change", repository_settings.on_sort_by_tags_change, false);
			}

			n = doc.querySelectorAll("input.settings_sort_by");
			for (i = 0; i < n.length; ++i) {
				n[i].addEventListener("change", repository_settings.on_sort_by_change, false);
			}

			repository_settings.setup_tags();
		},
		setup_tags: function () {
			var repositories = get_repositories(),
				doc = document,
				c1 = doc.querySelector(".settings_tags_container"),
				tag_map = {},
				tags, tags_sorted, tag, c2, n1, n2, n3, i, j;

			// Nothing to put it in
			if (c1 === null || (c2 = c1.querySelector(".settings_tags")) === null) return;

			// Count
			for (i = 0; i < repositories.length; ++i) {
				tags = get_repository_tags(repositories[i]);
				for (j = 0; j < tags.length; ++j) {
					tag = tags[j][0];
					if (tag in tag_map) ++tag_map[tag];
					else tag_map[tag] = 1;

					// Event
					tags[j][1].addEventListener("click", repository_settings.on_repository_tag_click, false);
				}
			}

			// Sort keys
			tags_sorted = [];
			for (i in tag_map) tags_sorted.push(i);
			if (tags_sorted.length === 0) return; // Nothing to do
			tags_sorted.sort();

			// Add tags
			for (i = 0; i < tags_sorted.length; ++i) {
				// Generate
				n1 = doc.createElement("a");
				n1.className = "settings_tag rainbow_underline rainbow_underline_inside";
				n1.setAttribute("data-tag-name", tags_sorted[i]);
				n1.setAttribute("data-tag-count", tag_map[tags_sorted[i]]);

				n2 = doc.createElement("span");
				n2.className = "rainbow_underline_inner";

				n3 = doc.createElement("span");
				n3.className = "settings_tag_text";
				n3.textContent = tags_sorted[i];

				n2.appendChild(n3);
				n1.appendChild(n2);

				n2 = doc.createElement("span");
				n2.className = "settings_tag_count";
				n2.textContent = "(" + tag_map[tags_sorted[i]] + ")";
				n1.appendChild(n2);

				// Events
				n1.addEventListener("click", repository_settings.on_tag_click, false);

				// Add
				c2.appendChild(n1);
			}

			// Visible
			c1.classList.add("settings_tags_container_visible");
		},

		get_sort_by: function () {
			var node = document.querySelector("input.settings_sort_by:checked");
			if (node === null) return null;

			return [ node.value , (node.getAttribute("data-is-default") === "true") ];
		},
		set_sort_by: function (mode, update_sort) {
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
			if (
				!update_sort ||
				(container = get_repository_container()) === null ||
				container.getAttribute("data-sort-by") === mode
			) return;
			nodes = get_repositories();
			sort_array = [];

			if (mode === "color") {
				for (i = 0; i < nodes.length; ++i) {
					if (nodes[i].parentNode === container) {
						val = get_repository_color(nodes[i]);
						val = rgb_to_hsv(val[0] / 255.0, val[1] / 255.0, val[2] / 255.0)[0];
						sort_array.push([ nodes[i] , val ]);
					}
				}
			}
			else { // if (mode === "name") {
				for (i = 0; i < nodes.length; ++i) {
					if (nodes[i].parentNode === container) {
						val = get_repository_name(nodes[i]);
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

			// Set
			container.setAttribute("data-sort-by", mode);
		},
		get_show_tags: function () {
			var n = document.querySelector("input.settings_sort_by_tags");
			return (n !== null && n.checked);
		},
		set_show_tags: function (show) {
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
		},
		get_selected_tags: function () {
			var tags = document.querySelectorAll(".settings_tags>.settings_tag.settings_tag_selected"),
				tag_selection = {},
				tag_array = [],
				tag_name, i;

			for (i = 0; i < tags.length; ++i) {
				tag_name = (tags[i].getAttribute("data-tag-name") || "");
				tag_selection[tag_name] = true;
			}

			for (i in tag_selection) tag_array.push(i);
			tag_array.sort();

			return tag_array;
		},
		set_selected_tags: function (tag_array, additive, subtractive) {
			// additive: tags that are already on will not be turned off if they aren't in tag_array
			// subtractive: tag_array will be turned off instead of on
			var doc = document,
				tags = doc.querySelectorAll(".settings_tags>.settings_tag"),
				selected_count = 0,
				tag_name, tag_matches, repositories, cls, i, j, o;

			cls = "settings_tag_selected";
			for (i = 0; i < tags.length; ++i) {
				o = tags[i];
				tag_name = (o.getAttribute("data-tag-name") || "");

				if ((j = tag_array.indexOf(tag_name)) >= 0) {
					if (subtractive) {
						o.classList.remove(cls);
						tag_array.splice(j, 1);
					}
					else {
						o.classList.add(cls);
						++selected_count;
					}
				}
				else {
					if (additive) {
						if (o.classList.contains(cls)) {
							tag_array.push(tag_name);
							++selected_count;
						}
					}
					else {
						o.classList.remove(cls);
					}
				}
			}

			// Show/hide repositories
			repositories = get_repositories();
			for (i = 0; i < repositories.length; ++i) {
				// Find tags
				o = repositories[i];
				tags = get_repository_tags(o);
				tag_matches = 0;

				// Find tag matches
				cls = "repository_tag_selected";
				for (j = 0; j < tags.length; ++j) {
					if (tag_array.indexOf(tags[j][0]) >= 0) {
						tags[j][1].classList.add(cls);
						++tag_matches;
					}
					else {
						tags[j][1].classList.remove(cls);
					}
				}

				// Update region display
				cls = "repository_filtered_out_by_tags";
				if (tag_matches === 0 && selected_count > 0) {
					o.classList.add(cls);
				}
				else {
					o.classList.remove(cls);
				}
			}
		},

		on_repository_tag_click: function () {
			var is_selected = this.classList.contains("repository_tag_selected"),
				tag_name = get_repository_tag_text(this);

			if (tag_name === null) return;

			// Update
			repository_settings.set_show_tags(true);
			repository_settings.set_selected_tags([ tag_name ], true, is_selected);
			update_url_hash(true);
		},
		on_tag_click: function (event) {
			if (event.which && event.which !== 1) return;

			// Selection change
			this.classList.toggle("settings_tag_selected");

			// Update URL
			update_url_hash(true);
		},
		on_sort_by_change: function () {
			if (this.checked) update_url_hash(true);
		},
		on_sort_by_tags_change: function () {
			update_url_hash(true);
		},
	};

	var update_url_hash = function (trigger_event) {
		var vars = [],
			sort_by = repository_settings.get_sort_by(),
			page = null,
			tags, arr, c;

		// Page
		if (
			content_handler.enabled &&
			(c = document.querySelector(".contents>.content.content_main")) !== null &&
			c.getAttribute("data-is-default") !== "true" &&
			(page = c.getAttribute("data-content-id") || null) !== null
		) {
			vars.push([ "page", page ]);
		}

		// Repository tags
		if (page === null || page === "repositories") {
			if (sort_by && !sort_by[1]) {
				// Only show if not default
				vars.push([ "sort-by" , sort_by[0] ]);
			}

			if (repository_settings.get_show_tags()) {
				arr = [ "tags" ];
				tags = repository_settings.get_selected_tags();
				if (tags.length > 0) {
					arr.push(tags.join(","));
				}
				vars.push(arr);
			}
		}

		// Go
		nav.go(nav.encode_vars(vars) || null, false, !trigger_event);
	};

	var on_navigation_change = function (event) {
		var hash = nav.get_hash(window.location.href),
			sort_by = null,
			show_tags, tags, vars;

		// Noscript
		if (re_noscript.test(hash)) {
			window.location.reload(false);
			return;
		}

		// Get values
		vars = nav.decode_vars(nav.strip_hash(hash));
		show_tags = ("tags" in vars);
		if ("sort-by" in vars) {
			sort_by = vars["sort-by"];
		}

		// Update display
		repository_settings.set_show_tags(show_tags);
		tags = (show_tags && vars.tags) ? vars.tags.split(",") : [];
		repository_settings.set_selected_tags(tags, false, false);
		sort_by = repository_settings.set_sort_by(sort_by, true);

		// Update page
		content_handler.go_to_content(vars.page || null, !event.init);
	};



	// Execute
	on_ready(function () {
		// Styling
		restyle_noscript();
		rice_checkboxes();
		rice_radiobuttons();

		// Touch events
		touch_handler = new TouchHandler();
		content_handler = new ContentHandler(touch_handler);

		// Repository settings
		repository_settings.setup();

		// Nav
		nav.on("change", on_navigation_change);
		nav.setup();
	});

})();


