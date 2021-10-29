
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function get_store_value(store) {
        let value;
        subscribe(store, _ => value = _)();
        return value;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if ($$scope.dirty === undefined) {
                return lets;
            }
            if (typeof lets === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function update_slot_base(slot, slot_definition, ctx, $$scope, slot_changes, get_slot_context_fn) {
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function get_all_dirty_from_scope($$scope) {
        if ($$scope.ctx.length > 32) {
            const dirty = [];
            const length = $$scope.ctx.length / 32;
            for (let i = 0; i < length; i++) {
                dirty[i] = -1;
            }
            return dirty;
        }
        return -1;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
        select.selectedIndex = -1; // no option should be selected
    }
    function custom_event(type, detail, bubbles = false) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                if (info.blocks[i] === block) {
                                    info.blocks[i] = null;
                                }
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function update_await_block_branch(info, ctx, dirty) {
        const child_ctx = ctx.slice();
        const { resolved } = info;
        if (info.current === info.then) {
            child_ctx[info.value] = resolved;
        }
        if (info.current === info.catch) {
            child_ctx[info.error] = resolved;
        }
        info.block.p(child_ctx, dirty);
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = on_mount.map(run).filter(is_function);
                if (on_destroy) {
                    on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.44.0' }, detail), true));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = new Set();
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (const subscriber of subscribers) {
                        subscriber[1]();
                        subscriber_queue.push(subscriber, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.add(subscriber);
            if (subscribers.size === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                subscribers.delete(subscriber);
                if (subscribers.size === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    //TODO: Think of a better way of storing environment variables
    const envStore = readable({
        BACKEND_URL: "http://localhost:8000"
    });
    const getEnv = () => {
        return get_store_value(envStore);
    };

    /* src\components\Button.svelte generated by Svelte v3.44.0 */

    const file$a = "src\\components\\Button.svelte";

    function create_fragment$a(ctx) {
    	let button;
    	let span0;
    	let t;
    	let span1;
    	let div;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[2].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[1], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			span0 = element("span");
    			t = space();
    			span1 = element("span");
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(span0, "class", "edge svelte-bz6d66");
    			add_location(span0, file$a, 4, 2, 100);
    			attr_dev(div, "class", "font-mont");
    			add_location(div, file$a, 6, 4, 151);
    			attr_dev(span1, "class", "front svelte-bz6d66");
    			add_location(span1, file$a, 5, 2, 125);
    			attr_dev(button, "class", "pushable svelte-bz6d66");
    			add_location(button, file$a, 3, 0, 52);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, span0);
    			append_dev(button, t);
    			append_dev(button, span1);
    			append_dev(span1, div);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*onClick*/ ctx[0])) /*onClick*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						default_slot,
    						default_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(default_slot_template, /*$$scope*/ ctx[1], dirty, null),
    						null
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, ['default']);
    	let { onClick } = $$props;
    	const writable_props = ['onClick'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ onClick });

    	$$self.$inject_state = $$props => {
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onClick, $$scope, slots];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, { onClick: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$a.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onClick*/ ctx[0] === undefined && !('onClick' in props)) {
    			console.warn("<Button> was created without expected prop 'onClick'");
    		}
    	}

    	get onClick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\pages\Login.svelte generated by Svelte v3.44.0 */
    const file$9 = "src\\pages\\Login.svelte";

    // (15:4) <Button onClick={googleLogin}>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("Login with Google");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(15:4) <Button onClick={googleLogin}>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let div1;
    	let div0;
    	let h1;
    	let t1;
    	let button;
    	let current;

    	button = new Button({
    			props: {
    				onClick: /*googleLogin*/ ctx[0],
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Complete Tasks. Get Memes.";
    			t1 = space();
    			create_component(button.$$.fragment);
    			attr_dev(h1, "class", "svelte-11rch98");
    			add_location(h1, file$9, 13, 4, 321);
    			attr_dev(div0, "class", "padded-center svelte-11rch98");
    			add_location(div0, file$9, 12, 2, 288);
    			attr_dev(div1, "class", "centered-child svelte-11rch98");
    			add_location(div1, file$9, 11, 0, 256);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h1);
    			append_dev(div0, t1);
    			mount_component(button, div0, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const button_changes = {};

    			if (dirty & /*$$scope*/ 4) {
    				button_changes.$$scope = { dirty, ctx };
    			}

    			button.$set(button_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			destroy_component(button);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$9($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Login', slots, []);
    	let ENV = getEnv();

    	const googleLogin = () => {
    		window.location = `${ENV.BACKEND_URL}/user/auth/google/login`;
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Login> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ getEnv, Button, ENV, googleLogin });

    	$$self.$inject_state = $$props => {
    		if ('ENV' in $$props) ENV = $$props.ENV;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [googleLogin];
    }

    class Login extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    const BACKEND_URL = getEnv().BACKEND_URL;
    const completeURL = (pathname) => {
        return (new URL(pathname, BACKEND_URL)).href;
    };
    const customFetch = {
        get: (url, opts = {}) => {
            return fetch(completeURL(url), Object.assign(Object.assign({}, opts), { credentials: 'include' })).then(response => response.json());
        },
        post: (url, body = {}, opts = {}) => {
            return fetch(completeURL(url), Object.assign(Object.assign({}, opts), { method: "POST", headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                }, credentials: 'include', body: JSON.stringify(body) })).then(response => response.json());
        },
        put: (url, body = {}, opts = {}) => {
            return fetch(completeURL(url), Object.assign(Object.assign({}, opts), { method: "PUT", headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                }, credentials: 'include', body: JSON.stringify(body) })).then(response => response.json());
        },
        patch: (url, body = {}, opts = {}) => {
            return fetch(completeURL(url), Object.assign(Object.assign({}, opts), { method: "PATCH", headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                }, credentials: 'include', body: JSON.stringify(body) })).then(response => response.json());
        },
        delete: (url, body = {}, opts = {}) => {
            return fetch(completeURL(url), Object.assign(Object.assign({}, opts), { method: "DELETE", headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json;charset=UTF-8",
                }, credentials: 'include', body: JSON.stringify(body) })).then(response => response.json());
        }
    };

    getEnv();
    function createUserStore() {
        const { subscribe, set, update } = writable(null);
        const refresh = async () => {
            const result = await customFetch.get(`/user/cur-user`);
            set(result.user);
            if (result.user === null)
                return;
            if (result.user.workspaces.length === 0)
                return;
            if (get_store_value(workspace) === null) {
                workspace.set(result.user.workspaces[0]);
            }
        };
        return {
            subscribe,
            set,
            update,
            refresh,
            newWorkspace: async () => {
                const result = await customFetch.post(`/user/create-workspace`);
                await refresh();
                return result;
            }
        };
    }
    const user = createUserStore();
    const workspace = writable(null);
    const userTodos = derived(user, ($user, set) => {
        if ($user === null) {
            set([]);
        }
        else {
            customFetch.get(`/user/todos`).then(todos => {
                set(todos);
            });
        }
    }, []);

    /* src\components\SideBarButton.svelte generated by Svelte v3.44.0 */

    const file$8 = "src\\components\\SideBarButton.svelte";
    const get_contents_slot_changes = dirty => ({});
    const get_contents_slot_context = ctx => ({});
    const get_logo_slot_changes = dirty => ({});
    const get_logo_slot_context = ctx => ({});

    function create_fragment$8(ctx) {
    	let div2;
    	let div1;
    	let t;
    	let div0;
    	let current;
    	let mounted;
    	let dispose;
    	const logo_slot_template = /*#slots*/ ctx[2].logo;
    	const logo_slot = create_slot(logo_slot_template, ctx, /*$$scope*/ ctx[1], get_logo_slot_context);
    	const contents_slot_template = /*#slots*/ ctx[2].contents;
    	const contents_slot = create_slot(contents_slot_template, ctx, /*$$scope*/ ctx[1], get_contents_slot_context);

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			if (logo_slot) logo_slot.c();
    			t = space();
    			div0 = element("div");
    			if (contents_slot) contents_slot.c();
    			attr_dev(div0, "class", "contents svelte-1m2l99o");
    			add_location(div0, file$8, 6, 4, 159);
    			attr_dev(div1, "class", "inner svelte-1m2l99o");
    			add_location(div1, file$8, 4, 2, 108);
    			attr_dev(div2, "class", "sidebar svelte-1m2l99o");
    			add_location(div2, file$8, 3, 0, 64);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);

    			if (logo_slot) {
    				logo_slot.m(div1, null);
    			}

    			append_dev(div1, t);
    			append_dev(div1, div0);

    			if (contents_slot) {
    				contents_slot.m(div0, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					div2,
    					"click",
    					function () {
    						if (is_function(/*onClick*/ ctx[0])) /*onClick*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (logo_slot) {
    				if (logo_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						logo_slot,
    						logo_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(logo_slot_template, /*$$scope*/ ctx[1], dirty, get_logo_slot_changes),
    						get_logo_slot_context
    					);
    				}
    			}

    			if (contents_slot) {
    				if (contents_slot.p && (!current || dirty & /*$$scope*/ 2)) {
    					update_slot_base(
    						contents_slot,
    						contents_slot_template,
    						ctx,
    						/*$$scope*/ ctx[1],
    						!current
    						? get_all_dirty_from_scope(/*$$scope*/ ctx[1])
    						: get_slot_changes(contents_slot_template, /*$$scope*/ ctx[1], dirty, get_contents_slot_changes),
    						get_contents_slot_context
    					);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logo_slot, local);
    			transition_in(contents_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logo_slot, local);
    			transition_out(contents_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (logo_slot) logo_slot.d(detaching);
    			if (contents_slot) contents_slot.d(detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('SideBarButton', slots, ['logo','contents']);

    	let { onClick = () => {
    		
    	} } = $$props;

    	const writable_props = ['onClick'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<SideBarButton> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('$$scope' in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ onClick });

    	$$self.$inject_state = $$props => {
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onClick, $$scope, slots];
    }

    class SideBarButton extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, { onClick: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SideBarButton",
    			options,
    			id: create_fragment$8.name
    		});
    	}

    	get onClick() {
    		throw new Error("<SideBarButton>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<SideBarButton>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\assets\Tick.svelte generated by Svelte v3.44.0 */

    const file$7 = "src\\components\\assets\\Tick.svelte";

    function create_fragment$7(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$7, 6, 2, 109);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "2em");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$7, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Tick', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Tick> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Tick extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tick",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src\components\Todo.svelte generated by Svelte v3.44.0 */
    const file$6 = "src\\components\\Todo.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (43:6) {#if expandedView}
    function create_if_block$1(ctx) {
    	let div2;
    	let div0;
    	let p0;
    	let t1;
    	let t2;
    	let div1;
    	let p1;
    	let t4;
    	let p2;
    	let each_value = /*todoData*/ ctx[0].assignees || [];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "Assignees";
    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t2 = space();
    			div1 = element("div");
    			p1 = element("p");
    			p1.textContent = "Deadline";
    			t4 = space();
    			p2 = element("p");
    			p2.textContent = "Today la fak";
    			attr_dev(p0, "class", "svelte-1dg19tb");
    			add_location(p0, file$6, 45, 12, 1359);
    			attr_dev(div0, "class", "item-6 svelte-1dg19tb");
    			add_location(div0, file$6, 44, 10, 1325);
    			attr_dev(p1, "class", "svelte-1dg19tb");
    			add_location(p1, file$6, 51, 12, 1551);
    			attr_dev(p2, "class", "svelte-1dg19tb");
    			add_location(p2, file$6, 52, 12, 1580);
    			attr_dev(div1, "class", "item-6 svelte-1dg19tb");
    			add_location(div1, file$6, 50, 10, 1517);
    			attr_dev(div2, "class", "container svelte-1dg19tb");
    			add_location(div2, file$6, 43, 8, 1290);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, p0);
    			append_dev(div0, t1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, p1);
    			append_dev(div1, t4);
    			append_dev(div1, p2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todoData*/ 1) {
    				each_value = /*todoData*/ ctx[0].assignees || [];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div0, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(43:6) {#if expandedView}",
    		ctx
    	});

    	return block;
    }

    // (47:12) {#each todoData.assignees || [] as assignee}
    function create_each_block$1(ctx) {
    	let p;
    	let t_value = /*assignee*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-1dg19tb");
    			add_location(p, file$6, 47, 14, 1449);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*todoData*/ 1 && t_value !== (t_value = /*assignee*/ ctx[8] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(47:12) {#each todoData.assignees || [] as assignee}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div6;
    	let input0;
    	let input0_id_value;
    	let input0_checked_value;
    	let t0;
    	let label;
    	let tick_1;
    	let label_for_value;
    	let t1;
    	let div5;
    	let div2;
    	let input1;
    	let input1_value_value;
    	let t2;
    	let div0;
    	let input2;
    	let input2_value_value;
    	let t3;
    	let t4;
    	let div1;
    	let t5;
    	let t6_value = /*todoData*/ ctx[0].workspace.name + "";
    	let t6;
    	let t7;
    	let div3;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let select_value_value;
    	let t11;
    	let div4;
    	let button;
    	let current;
    	let mounted;
    	let dispose;
    	tick_1 = new Tick({ $$inline: true });
    	let if_block = /*expandedView*/ ctx[1] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			input0 = element("input");
    			t0 = space();
    			label = element("label");
    			create_component(tick_1.$$.fragment);
    			t1 = space();
    			div5 = element("div");
    			div2 = element("div");
    			input1 = element("input");
    			t2 = space();
    			div0 = element("div");
    			input2 = element("input");
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();
    			div1 = element("div");
    			t5 = text("Workspace: ");
    			t6 = text(t6_value);
    			t7 = space();
    			div3 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Low";
    			option1 = element("option");
    			option1.textContent = "Medium";
    			option2 = element("option");
    			option2.textContent = "High";
    			t11 = space();
    			div4 = element("div");
    			button = element("button");
    			button.textContent = "Delete";
    			attr_dev(input0, "class", "hidden svelte-1dg19tb");
    			attr_dev(input0, "id", input0_id_value = `completed-${/*todoData*/ ctx[0].id}`);
    			attr_dev(input0, "type", "checkbox");
    			input0.checked = input0_checked_value = /*todoData*/ ctx[0].completed;
    			add_location(input0, file$6, 18, 2, 573);
    			attr_dev(label, "for", label_for_value = `completed-${/*todoData*/ ctx[0].id}`);
    			attr_dev(label, "class", "checkbox-container padded svelte-1dg19tb");
    			add_location(label, file$6, 25, 2, 768);
    			attr_dev(input1, "type", "text");
    			input1.value = input1_value_value = /*todoData*/ ctx[0].summary;
    			attr_dev(input1, "placeholder", "Task Name");
    			attr_dev(input1, "class", "svelte-1dg19tb");
    			add_location(input1, file$6, 30, 6, 929);
    			input2.value = input2_value_value = /*todoData*/ ctx[0].desc;
    			attr_dev(input2, "class", "svelte-1dg19tb");
    			add_location(input2, file$6, 37, 8, 1123);
    			attr_dev(div0, "class", "svelte-1dg19tb");
    			add_location(div0, file$6, 36, 6, 1108);
    			attr_dev(div1, "class", "svelte-1dg19tb");
    			add_location(div1, file$6, 56, 6, 1654);
    			attr_dev(div2, "class", "vertical svelte-1dg19tb");
    			add_location(div2, file$6, 29, 4, 898);
    			option0.__value = "low";
    			option0.value = option0.__value;
    			attr_dev(option0, "class", "svelte-1dg19tb");
    			add_location(option0, file$6, 63, 8, 1876);
    			option1.__value = "med";
    			option1.value = option1.__value;
    			attr_dev(option1, "class", "svelte-1dg19tb");
    			add_location(option1, file$6, 64, 8, 1918);
    			option2.__value = "high";
    			option2.value = option2.__value;
    			attr_dev(option2, "class", "svelte-1dg19tb");
    			add_location(option2, file$6, 65, 8, 1963);
    			attr_dev(select, "class", "svelte-1dg19tb");
    			add_location(select, file$6, 59, 6, 1747);
    			attr_dev(div3, "class", "item-1 svelte-1dg19tb");
    			add_location(div3, file$6, 58, 4, 1719);
    			attr_dev(button, "class", "svelte-1dg19tb");
    			add_location(button, file$6, 69, 6, 2060);
    			attr_dev(div4, "class", "item-1 svelte-1dg19tb");
    			add_location(div4, file$6, 68, 4, 2032);
    			attr_dev(div5, "class", "padded svelte-1dg19tb");
    			add_location(div5, file$6, 28, 2, 872);
    			attr_dev(div6, "class", "parent svelte-1dg19tb");
    			add_location(div6, file$6, 17, 0, 549);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, input0);
    			append_dev(div6, t0);
    			append_dev(div6, label);
    			mount_component(tick_1, label, null);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, input1);
    			append_dev(div2, t2);
    			append_dev(div2, div0);
    			append_dev(div0, input2);
    			append_dev(div2, t3);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t4);
    			append_dev(div2, div1);
    			append_dev(div1, t5);
    			append_dev(div1, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div3);
    			append_dev(div3, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*todoData*/ ctx[0].priority);
    			append_dev(div5, t11);
    			append_dev(div5, div4);
    			append_dev(div4, button);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[4], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[5], false, false, false),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[6], false, false, false),
    					listen_dev(select, "change", /*change_handler_3*/ ctx[7], false, false, false),
    					listen_dev(button, "click", /*onDelete*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (!current || dirty & /*todoData*/ 1 && input0_id_value !== (input0_id_value = `completed-${/*todoData*/ ctx[0].id}`)) {
    				attr_dev(input0, "id", input0_id_value);
    			}

    			if (!current || dirty & /*todoData*/ 1 && input0_checked_value !== (input0_checked_value = /*todoData*/ ctx[0].completed)) {
    				prop_dev(input0, "checked", input0_checked_value);
    			}

    			if (!current || dirty & /*todoData*/ 1 && label_for_value !== (label_for_value = `completed-${/*todoData*/ ctx[0].id}`)) {
    				attr_dev(label, "for", label_for_value);
    			}

    			if (!current || dirty & /*todoData*/ 1 && input1_value_value !== (input1_value_value = /*todoData*/ ctx[0].summary) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (!current || dirty & /*todoData*/ 1 && input2_value_value !== (input2_value_value = /*todoData*/ ctx[0].desc) && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (/*expandedView*/ ctx[1]) if_block.p(ctx, dirty);
    			if ((!current || dirty & /*todoData*/ 1) && t6_value !== (t6_value = /*todoData*/ ctx[0].workspace.name + "")) set_data_dev(t6, t6_value);

    			if (!current || dirty & /*todoData*/ 1 && select_value_value !== (select_value_value = /*todoData*/ ctx[0].priority)) {
    				select_option(select, /*todoData*/ ctx[0].priority);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tick_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tick_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			destroy_component(tick_1);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Todo', slots, []);
    	let { todoData } = $$props;
    	let expandedView = false;

    	const onDelete = async () => {
    		//TODO: Optimise this to not fetch full amount each time
    		await customFetch.delete(`/todo/${todoData.id}`);

    		await user.refresh();
    	};

    	const onUpdate = async (key, value) => {
    		await customFetch.patch(`/todo/${todoData.id}`, { [key]: value });
    	};

    	const writable_props = ['todoData'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Todo> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => onUpdate("completed", e.target["checked"]);
    	const change_handler_1 = e => onUpdate("summary", e.target["value"]);
    	const change_handler_2 = e => onUpdate("desc", e.target["value"]);
    	const change_handler_3 = e => onUpdate("priority", e.target["value"]);

    	$$self.$$set = $$props => {
    		if ('todoData' in $$props) $$invalidate(0, todoData = $$props.todoData);
    	};

    	$$self.$capture_state = () => ({
    		user,
    		customFetch,
    		Tick,
    		todoData,
    		expandedView,
    		onDelete,
    		onUpdate
    	});

    	$$self.$inject_state = $$props => {
    		if ('todoData' in $$props) $$invalidate(0, todoData = $$props.todoData);
    		if ('expandedView' in $$props) $$invalidate(1, expandedView = $$props.expandedView);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todoData,
    		expandedView,
    		onDelete,
    		onUpdate,
    		change_handler,
    		change_handler_1,
    		change_handler_2,
    		change_handler_3
    	];
    }

    class Todo extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, { todoData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$6.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*todoData*/ ctx[0] === undefined && !('todoData' in props)) {
    			console.warn("<Todo> was created without expected prop 'todoData'");
    		}
    	}

    	get todoData() {
    		throw new Error("<Todo>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set todoData(value) {
    		throw new Error("<Todo>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\assets\NewTask.svelte generated by Svelte v3.44.0 */

    const file$5 = "src\\components\\assets\\NewTask.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z");
    			attr_dev(path, "clip-rule", "evenodd");
    			add_location(path, file$5, 6, 2, 111);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "2em");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$5, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('NewTask', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<NewTask> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class NewTask extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "NewTask",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\assets\AddFriend.svelte generated by Svelte v3.44.0 */

    const file$4 = "src\\components\\assets\\AddFriend.svelte";

    function create_fragment$4(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z");
    			add_location(path, file$4, 6, 2, 111);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "2em");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$4, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('AddFriend', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<AddFriend> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class AddFriend extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "AddFriend",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\assets\Filter.svelte generated by Svelte v3.44.0 */

    const file$3 = "src\\components\\assets\\Filter.svelte";

    function create_fragment$3(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z");
    			add_location(path, file$3, 6, 2, 111);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "2em");
    			attr_dev(svg, "viewBox", "0 0 20 20");
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$3, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Filter', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Filter> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Filter extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Filter",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\assets\Logout.svelte generated by Svelte v3.44.0 */

    const file$2 = "src\\components\\assets\\Logout.svelte";

    function create_fragment$2(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1");
    			add_location(path, file$2, 7, 2, 128);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "height", "2em");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$2, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Logout', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Logout> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class Logout extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Logout",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\pages\Todos.svelte generated by Svelte v3.44.0 */

    const { console: console_1 } = globals;
    const file$1 = "src\\pages\\Todos.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    // (1:0) <script lang="ts">import "../components/WorkspaceSelect.svelte";  import { getEnv }
    function create_catch_block$1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script lang=\\\"ts\\\">import \\\"../components/WorkspaceSelect.svelte\\\";  import { getEnv }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script lang="ts">import "../components/WorkspaceSelect.svelte";  import { getEnv }
    function create_then_block$1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(1:0) <script lang=\\\"ts\\\">import \\\"../components/WorkspaceSelect.svelte\\\";  import { getEnv }",
    		ctx
    	});

    	return block;
    }

    // (41:22)     <div>Loading Workspace</div>  {/await}
    function create_pending_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Loading Workspace";
    			attr_dev(div, "class", "svelte-1qgrp4b");
    			add_location(div, file$1, 41, 2, 1486);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block$1.name,
    		type: "pending",
    		source: "(41:22)     <div>Loading Workspace</div>  {/await}",
    		ctx
    	});

    	return block;
    }

    // (47:4) {#each $userTodos as todo}
    function create_each_block(ctx) {
    	let todo;
    	let current;

    	todo = new Todo({
    			props: { todoData: /*todo*/ ctx[9] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(todo.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todo, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const todo_changes = {};
    			if (dirty & /*$userTodos*/ 1) todo_changes.todoData = /*todo*/ ctx[9];
    			todo.$set(todo_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todo.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todo.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todo, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(47:4) {#each $userTodos as todo}",
    		ctx
    	});

    	return block;
    }

    // (58:6) 
    function create_logo_slot_3(ctx) {
    	let newtask;
    	let current;
    	newtask = new NewTask({ props: { slot: "logo" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(newtask.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(newtask, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(newtask.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(newtask.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(newtask, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_logo_slot_3.name,
    		type: "slot",
    		source: "(58:6) ",
    		ctx
    	});

    	return block;
    }

    // (59:6) 
    function create_contents_slot_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "New Task";
    			attr_dev(div, "slot", "contents");
    			attr_dev(div, "class", "svelte-1qgrp4b");
    			add_location(div, file$1, 58, 6, 1910);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_contents_slot_3.name,
    		type: "slot",
    		source: "(59:6) ",
    		ctx
    	});

    	return block;
    }

    // (62:6) 
    function create_logo_slot_2(ctx) {
    	let addfriend;
    	let current;
    	addfriend = new AddFriend({ props: { slot: "logo" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(addfriend.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(addfriend, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(addfriend.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(addfriend.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(addfriend, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_logo_slot_2.name,
    		type: "slot",
    		source: "(62:6) ",
    		ctx
    	});

    	return block;
    }

    // (63:6) 
    function create_contents_slot_2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Invite Friend";
    			attr_dev(div, "slot", "contents");
    			attr_dev(div, "class", "svelte-1qgrp4b");
    			add_location(div, file$1, 62, 6, 2059);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_contents_slot_2.name,
    		type: "slot",
    		source: "(63:6) ",
    		ctx
    	});

    	return block;
    }

    // (66:6) 
    function create_logo_slot_1(ctx) {
    	let filter;
    	let current;
    	filter = new Filter({ props: { slot: "logo" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(filter.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(filter, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(filter.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(filter.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(filter, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_logo_slot_1.name,
    		type: "slot",
    		source: "(66:6) ",
    		ctx
    	});

    	return block;
    }

    // (67:6) 
    function create_contents_slot_1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Filter";
    			attr_dev(div, "slot", "contents");
    			attr_dev(div, "class", "svelte-1qgrp4b");
    			add_location(div, file$1, 66, 6, 2180);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_contents_slot_1.name,
    		type: "slot",
    		source: "(67:6) ",
    		ctx
    	});

    	return block;
    }

    // (70:6) 
    function create_logo_slot(ctx) {
    	let logout_1;
    	let current;
    	logout_1 = new Logout({ props: { slot: "logo" }, $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(logout_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(logout_1, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(logout_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(logout_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(logout_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_logo_slot.name,
    		type: "slot",
    		source: "(70:6) ",
    		ctx
    	});

    	return block;
    }

    // (71:6) 
    function create_contents_slot(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Logout";
    			attr_dev(div, "slot", "contents");
    			attr_dev(div, "class", "svelte-1qgrp4b");
    			add_location(div, file$1, 70, 6, 2311);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_contents_slot.name,
    		type: "slot",
    		source: "(71:6) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let t0;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let sidebarbutton0;
    	let t2;
    	let sidebarbutton1;
    	let t3;
    	let sidebarbutton2;
    	let t4;
    	let sidebarbutton3;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block$1,
    		then: create_then_block$1,
    		catch: create_catch_block$1
    	};

    	handle_promise(/*initWorkspace*/ ctx[4], info);
    	let each_value = /*$userTodos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	sidebarbutton0 = new SideBarButton({
    			props: {
    				onClick: /*newTask*/ ctx[1],
    				$$slots: {
    					contents: [create_contents_slot_3],
    					logo: [create_logo_slot_3]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sidebarbutton1 = new SideBarButton({
    			props: {
    				onClick: /*addToWorkspaceAlert*/ ctx[3],
    				$$slots: {
    					contents: [create_contents_slot_2],
    					logo: [create_logo_slot_2]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sidebarbutton2 = new SideBarButton({
    			props: {
    				$$slots: {
    					contents: [create_contents_slot_1],
    					logo: [create_logo_slot_1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	sidebarbutton3 = new SideBarButton({
    			props: {
    				onClick: /*logout*/ ctx[2],
    				$$slots: {
    					contents: [create_contents_slot],
    					logo: [create_logo_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			info.block.c();
    			t0 = space();
    			div2 = element("div");
    			div0 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t1 = space();
    			div1 = element("div");
    			create_component(sidebarbutton0.$$.fragment);
    			t2 = space();
    			create_component(sidebarbutton1.$$.fragment);
    			t3 = space();
    			create_component(sidebarbutton2.$$.fragment);
    			t4 = space();
    			create_component(sidebarbutton3.$$.fragment);
    			attr_dev(div0, "class", "col1 svelte-1qgrp4b");
    			add_location(div0, file$1, 45, 2, 1555);
    			attr_dev(div1, "class", "col2 svelte-1qgrp4b");
    			add_location(div1, file$1, 50, 2, 1664);
    			attr_dev(div2, "class", "container svelte-1qgrp4b");
    			add_location(div2, file$1, 44, 0, 1528);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			info.block.m(target, info.anchor = anchor);
    			info.mount = () => t0.parentNode;
    			info.anchor = t0;
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			mount_component(sidebarbutton0, div1, null);
    			append_dev(div1, t2);
    			mount_component(sidebarbutton1, div1, null);
    			append_dev(div1, t3);
    			mount_component(sidebarbutton2, div1, null);
    			append_dev(div1, t4);
    			mount_component(sidebarbutton3, div1, null);
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;

    			if (dirty & /*$userTodos*/ 1) {
    				each_value = /*$userTodos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div0, null);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			const sidebarbutton0_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				sidebarbutton0_changes.$$scope = { dirty, ctx };
    			}

    			sidebarbutton0.$set(sidebarbutton0_changes);
    			const sidebarbutton1_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				sidebarbutton1_changes.$$scope = { dirty, ctx };
    			}

    			sidebarbutton1.$set(sidebarbutton1_changes);
    			const sidebarbutton2_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				sidebarbutton2_changes.$$scope = { dirty, ctx };
    			}

    			sidebarbutton2.$set(sidebarbutton2_changes);
    			const sidebarbutton3_changes = {};

    			if (dirty & /*$$scope*/ 4096) {
    				sidebarbutton3_changes.$$scope = { dirty, ctx };
    			}

    			sidebarbutton3.$set(sidebarbutton3_changes);
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(sidebarbutton0.$$.fragment, local);
    			transition_in(sidebarbutton1.$$.fragment, local);
    			transition_in(sidebarbutton2.$$.fragment, local);
    			transition_in(sidebarbutton3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(sidebarbutton0.$$.fragment, local);
    			transition_out(sidebarbutton1.$$.fragment, local);
    			transition_out(sidebarbutton2.$$.fragment, local);
    			transition_out(sidebarbutton3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			destroy_component(sidebarbutton0);
    			destroy_component(sidebarbutton1);
    			destroy_component(sidebarbutton2);
    			destroy_component(sidebarbutton3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let $user;
    	let $workspace;
    	let $userTodos;
    	validate_store(user, 'user');
    	component_subscribe($$self, user, $$value => $$invalidate(5, $user = $$value));
    	validate_store(workspace, 'workspace');
    	component_subscribe($$self, workspace, $$value => $$invalidate(6, $workspace = $$value));
    	validate_store(userTodos, 'userTodos');
    	component_subscribe($$self, userTodos, $$value => $$invalidate(0, $userTodos = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Todos', slots, []);
    	let ENV = getEnv();

    	const newTask = async () => {
    		//TODO: Don't get the whole response each time
    		await customFetch.post(`todo`, {
    			creatorId: $user.id,
    			workspaceId: $workspace.id
    		});

    		await user.refresh();
    	};

    	const logout = () => {
    		window.location.href = `${ENV.BACKEND_URL}/user/auth/google/logout`;
    	};

    	const addToWorkspaceAlert = () => {
    		const userId = prompt("Friend ID");
    		addToWorkspace(userId, $workspace.id);
    	};

    	const addToWorkspace = async (userId, workspaceId) => {
    		const result = await customFetch.post(`/workspace/${workspaceId}/add-user/${userId}`);
    		console.log(result);
    	};

    	const initWorkspace = (async () => {
    		if ($user.workspaces.length === 0) {
    			user.newWorkspace();
    		} else {
    			workspace.set($user.workspaces[0]);
    		}
    	})();

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console_1.warn(`<Todos> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getEnv,
    		user,
    		userTodos,
    		workspace,
    		customFetch,
    		SideBarButton,
    		Todo,
    		NewTask,
    		AddFriend,
    		Filter,
    		Logout,
    		ENV,
    		newTask,
    		logout,
    		addToWorkspaceAlert,
    		addToWorkspace,
    		initWorkspace,
    		$user,
    		$workspace,
    		$userTodos
    	});

    	$$self.$inject_state = $$props => {
    		if ('ENV' in $$props) ENV = $$props.ENV;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [$userTodos, newTask, logout, addToWorkspaceAlert, initWorkspace];
    }

    class Todos extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todos",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.44.0 */
    const file = "src\\App.svelte";

    // (17:4) {:catch err}
    function create_catch_block(ctx) {
    	let div;
    	let t_value = String(/*err*/ ctx[2]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			attr_dev(div, "class", "svelte-5xwtj0");
    			add_location(div, file, 17, 6, 415);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(17:4) {:catch err}",
    		ctx
    	});

    	return block;
    }

    // (11:4) {:then}
    function create_then_block(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$user*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index !== previous_block_index) {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(11:4) {:then}",
    		ctx
    	});

    	return block;
    }

    // (14:6) {:else}
    function create_else_block(ctx) {
    	let login;
    	let current;
    	login = new Login({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(login.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(login, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(login.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(login.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(login, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(14:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (12:6) {#if $user}
    function create_if_block(ctx) {
    	let todos;
    	let current;
    	todos = new Todos({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(todos.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(todos, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(todos.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(todos.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(todos, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(12:6) {#if $user}",
    		ctx
    	});

    	return block;
    }

    // (9:25)        <div></div>     {:then}
    function create_pending_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			attr_dev(div, "class", "svelte-5xwtj0");
    			add_location(div, file, 9, 6, 288);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(9:25)        <div></div>     {:then}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div1;
    	let div0;
    	let current;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: true,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		error: 2,
    		blocks: [,,,]
    	};

    	handle_promise(/*fetchProfile*/ ctx[1], info);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			info.block.c();
    			attr_dev(div0, "class", "max-width-lg svelte-5xwtj0");
    			add_location(div0, file, 7, 2, 229);
    			attr_dev(div1, "class", "outer-container svelte-5xwtj0");
    			add_location(div1, file, 6, 0, 197);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			info.block.m(div0, info.anchor = null);
    			info.mount = () => div0;
    			info.anchor = null;
    			current = true;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			update_await_block_branch(info, ctx, dirty);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(info.block);
    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < 3; i += 1) {
    				const block = info.blocks[i];
    				transition_out(block);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $user;
    	validate_store(user, 'user');
    	component_subscribe($$self, user, $$value => $$invalidate(0, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	const fetchProfile = user.refresh();
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Login, Todos, user, fetchProfile, $user });
    	return [$user, fetchProfile];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
        target: document.body
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
