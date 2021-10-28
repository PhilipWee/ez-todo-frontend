
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
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

    /* src\pages\Login.svelte generated by Svelte v3.44.0 */
    const file$5 = "src\\pages\\Login.svelte";

    function create_fragment$5(ctx) {
    	let div;
    	let button;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Login with Google";
    			add_location(button, file$5, 11, 2, 247);
    			attr_dev(div, "class", "centered-child max-width-lg svelte-6kdobk");
    			add_location(div, file$5, 10, 0, 202);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*googleLogin*/ ctx[0], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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

    function instance$5($$self, $$props, $$invalidate) {
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

    	$$self.$capture_state = () => ({ getEnv, ENV, googleLogin });

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
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Login",
    			options,
    			id: create_fragment$5.name
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

    /* src\components\Todo.svelte generated by Svelte v3.44.0 */
    const file$4 = "src\\components\\Todo.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (31:4) {#if expandedView}
    function create_if_block$2(ctx) {
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
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
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
    			add_location(p0, file$4, 33, 10, 1089);
    			attr_dev(div0, "class", "item-6 svelte-ib2t4a");
    			add_location(div0, file$4, 32, 8, 1057);
    			add_location(p1, file$4, 39, 10, 1269);
    			add_location(p2, file$4, 40, 10, 1296);
    			attr_dev(div1, "class", "item-6 svelte-ib2t4a");
    			add_location(div1, file$4, 38, 8, 1237);
    			attr_dev(div2, "class", "container svelte-ib2t4a");
    			add_location(div2, file$4, 31, 6, 1024);
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
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(31:4) {#if expandedView}",
    		ctx
    	});

    	return block;
    }

    // (35:10) {#each todoData.assignees || [] as assignee}
    function create_each_block$2(ctx) {
    	let p;
    	let t_value = /*assignee*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			add_location(p, file$4, 35, 12, 1175);
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
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(35:10) {#each todoData.assignees || [] as assignee}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div7;
    	let div0;
    	let input0;
    	let input0_checked_value;
    	let t0;
    	let div4;
    	let div1;
    	let input1;
    	let input1_value_value;
    	let t1;
    	let div2;
    	let input2;
    	let input2_value_value;
    	let t2;
    	let t3;
    	let div3;
    	let t4;
    	let t5_value = /*todoData*/ ctx[0].workspace.name + "";
    	let t5;
    	let t6;
    	let div5;
    	let select;
    	let option0;
    	let option1;
    	let option2;
    	let select_value_value;
    	let t10;
    	let div6;
    	let button;
    	let mounted;
    	let dispose;
    	let if_block = /*expandedView*/ ctx[1] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div7 = element("div");
    			div0 = element("div");
    			input0 = element("input");
    			t0 = space();
    			div4 = element("div");
    			div1 = element("div");
    			input1 = element("input");
    			t1 = space();
    			div2 = element("div");
    			input2 = element("input");
    			t2 = space();
    			if (if_block) if_block.c();
    			t3 = space();
    			div3 = element("div");
    			t4 = text("Workspace: ");
    			t5 = text(t5_value);
    			t6 = space();
    			div5 = element("div");
    			select = element("select");
    			option0 = element("option");
    			option0.textContent = "Low";
    			option1 = element("option");
    			option1.textContent = "Medium";
    			option2 = element("option");
    			option2.textContent = "High";
    			t10 = space();
    			div6 = element("div");
    			button = element("button");
    			button.textContent = "Delete";
    			attr_dev(input0, "type", "checkbox");
    			input0.checked = input0_checked_value = /*todoData*/ ctx[0].completed;
    			add_location(input0, file$4, 18, 4, 567);
    			attr_dev(div0, "class", "item-1 svelte-ib2t4a");
    			add_location(div0, file$4, 17, 2, 541);
    			input1.value = input1_value_value = /*todoData*/ ctx[0].summary;
    			add_location(input1, file$4, 22, 6, 752);
    			add_location(div1, file$4, 21, 4, 739);
    			input2.value = input2_value_value = /*todoData*/ ctx[0].desc;
    			add_location(input2, file$4, 28, 6, 897);
    			add_location(div2, file$4, 27, 4, 884);
    			add_location(div3, file$4, 44, 4, 1362);
    			attr_dev(div4, "class", "item-10 container vertical svelte-ib2t4a");
    			add_location(div4, file$4, 20, 2, 693);
    			option0.__value = "low";
    			option0.value = option0.__value;
    			add_location(option0, file$4, 51, 6, 1567);
    			option1.__value = "med";
    			option1.value = option1.__value;
    			add_location(option1, file$4, 52, 6, 1607);
    			option2.__value = "high";
    			option2.value = option2.__value;
    			add_location(option2, file$4, 53, 6, 1650);
    			add_location(select, file$4, 47, 4, 1449);
    			attr_dev(div5, "class", "item-1 svelte-ib2t4a");
    			add_location(div5, file$4, 46, 2, 1423);
    			add_location(button, file$4, 57, 4, 1739);
    			attr_dev(div6, "class", "item-1 svelte-ib2t4a");
    			add_location(div6, file$4, 56, 2, 1713);
    			attr_dev(div7, "class", "button container svelte-ib2t4a");
    			add_location(div7, file$4, 16, 0, 507);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div7, anchor);
    			append_dev(div7, div0);
    			append_dev(div0, input0);
    			append_dev(div7, t0);
    			append_dev(div7, div4);
    			append_dev(div4, div1);
    			append_dev(div1, input1);
    			append_dev(div4, t1);
    			append_dev(div4, div2);
    			append_dev(div2, input2);
    			append_dev(div4, t2);
    			if (if_block) if_block.m(div4, null);
    			append_dev(div4, t3);
    			append_dev(div4, div3);
    			append_dev(div3, t4);
    			append_dev(div3, t5);
    			append_dev(div7, t6);
    			append_dev(div7, div5);
    			append_dev(div5, select);
    			append_dev(select, option0);
    			append_dev(select, option1);
    			append_dev(select, option2);
    			select_option(select, /*todoData*/ ctx[0].priority);
    			append_dev(div7, t10);
    			append_dev(div7, div6);
    			append_dev(div6, button);

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
    			if (dirty & /*todoData*/ 1 && input0_checked_value !== (input0_checked_value = /*todoData*/ ctx[0].completed)) {
    				prop_dev(input0, "checked", input0_checked_value);
    			}

    			if (dirty & /*todoData*/ 1 && input1_value_value !== (input1_value_value = /*todoData*/ ctx[0].summary) && input1.value !== input1_value_value) {
    				prop_dev(input1, "value", input1_value_value);
    			}

    			if (dirty & /*todoData*/ 1 && input2_value_value !== (input2_value_value = /*todoData*/ ctx[0].desc) && input2.value !== input2_value_value) {
    				prop_dev(input2, "value", input2_value_value);
    			}

    			if (/*expandedView*/ ctx[1]) if_block.p(ctx, dirty);
    			if (dirty & /*todoData*/ 1 && t5_value !== (t5_value = /*todoData*/ ctx[0].workspace.name + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*todoData*/ 1 && select_value_value !== (select_value_value = /*todoData*/ ctx[0].priority)) {
    				select_option(select, /*todoData*/ ctx[0].priority);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div7);
    			if (if_block) if_block.d();
    			mounted = false;
    			run_all(dispose);
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

    function instance$4($$self, $$props, $$invalidate) {
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

    	const change_handler = e => onUpdate("completed", e.target.checked);
    	const change_handler_1 = e => onUpdate("summary", e.target.value);
    	const change_handler_2 = e => onUpdate("desc", e.target.value);
    	const change_handler_3 = e => onUpdate("priority", e.target.value);

    	$$self.$$set = $$props => {
    		if ('todoData' in $$props) $$invalidate(0, todoData = $$props.todoData);
    	};

    	$$self.$capture_state = () => ({
    		user,
    		customFetch,
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { todoData: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Todo",
    			options,
    			id: create_fragment$4.name
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

    /* src\components\Button.svelte generated by Svelte v3.44.0 */

    const file$3 = "src\\components\\Button.svelte";

    function create_fragment$3(ctx) {
    	let div;
    	let t;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(/*text*/ ctx[1]);
    			attr_dev(div, "class", "button svelte-ib2t4a");
    			add_location(div, file$3, 4, 0, 70);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);

    			if (!mounted) {
    				dispose = listen_dev(
    					div,
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
    			if (dirty & /*text*/ 2) set_data_dev(t, /*text*/ ctx[1]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Button', slots, []);
    	let { onClick } = $$props;
    	let { text } = $$props;
    	const writable_props = ['onClick', 'text'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    	};

    	$$self.$capture_state = () => ({ onClick, text });

    	$$self.$inject_state = $$props => {
    		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
    		if ('text' in $$props) $$invalidate(1, text = $$props.text);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onClick, text];
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { onClick: 0, text: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Button",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onClick*/ ctx[0] === undefined && !('onClick' in props)) {
    			console.warn("<Button> was created without expected prop 'onClick'");
    		}

    		if (/*text*/ ctx[1] === undefined && !('text' in props)) {
    			console.warn("<Button> was created without expected prop 'text'");
    		}
    	}

    	get onClick() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onClick(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get text() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set text(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const parse = (e) => {
        const formData = new FormData(e.target);
        const data = {};
        for (let field of formData) {
            const [key, value] = field;
            data[key] = value;
        }
        return data;
    };

    /* src\components\WorkspaceSelect.svelte generated by Svelte v3.44.0 */
    const file$2 = "src\\components\\WorkspaceSelect.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (73:2) {:else}
    function create_else_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Loading";
    			add_location(div, file$2, 73, 4, 2278);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(73:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:2) {#if $workspace !== null}
    function create_if_block$1(ctx) {
    	let div0;
    	let t1;
    	let form;
    	let input;
    	let input_value_value;
    	let t2;
    	let button0;
    	let t4;
    	let button1;
    	let t6;
    	let div1;
    	let t8;
    	let each_1_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*$user*/ ctx[1].workspaces;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Current Workspace";
    			t1 = space();
    			form = element("form");
    			input = element("input");
    			t2 = space();
    			button0 = element("button");
    			button0.textContent = "Update";
    			t4 = space();
    			button1 = element("button");
    			button1.textContent = "Create";
    			t6 = space();
    			div1 = element("div");
    			div1.textContent = "All Workspaces";
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(div0, file$2, 48, 4, 1603);
    			attr_dev(input, "name", "name");
    			input.value = input_value_value = /*$workspace*/ ctx[0].name;
    			add_location(input, file$2, 50, 6, 1687);
    			attr_dev(button0, "type", "submit");
    			attr_dev(button0, "name", "update");
    			add_location(button0, file$2, 51, 6, 1740);
    			attr_dev(button1, "type", "submit");
    			attr_dev(button1, "name", "create");
    			add_location(button1, file$2, 52, 6, 1799);
    			add_location(form, file$2, 49, 4, 1637);
    			add_location(div1, file$2, 54, 4, 1869);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, form, anchor);
    			append_dev(form, input);
    			append_dev(form, t2);
    			append_dev(form, button0);
    			append_dev(form, t4);
    			append_dev(form, button1);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			insert_dev(target, t8, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(form, "submit", prevent_default(/*onSubmit*/ ctx[2]), false, true, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$workspace*/ 1 && input_value_value !== (input_value_value = /*$workspace*/ ctx[0].name) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*deleteWorkspace, $user, workspace*/ 10) {
    				each_value = /*$user*/ ctx[1].workspaces;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(form);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t8);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(48:2) {#if $workspace !== null}",
    		ctx
    	});

    	return block;
    }

    // (56:4) {#each $user.workspaces as userWorkspace}
    function create_each_block$1(ctx) {
    	let button0;
    	let t0_value = /*userWorkspace*/ ctx[7].name + "";
    	let t0;
    	let t1;
    	let button1;
    	let t3;
    	let br;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*userWorkspace*/ ctx[7]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[5](/*userWorkspace*/ ctx[7]);
    	}

    	const block = {
    		c: function create() {
    			button0 = element("button");
    			t0 = text(t0_value);
    			t1 = space();
    			button1 = element("button");
    			button1.textContent = "Delete";
    			t3 = space();
    			br = element("br");
    			add_location(button0, file$2, 56, 6, 1949);
    			add_location(button1, file$2, 63, 6, 2100);
    			add_location(br, file$2, 70, 6, 2242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button0, anchor);
    			append_dev(button0, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, button1, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, br, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$user*/ 2 && t0_value !== (t0_value = /*userWorkspace*/ ctx[7].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(button1);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(56:4) {#each $user.workspaces as userWorkspace}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;

    	function select_block_type(ctx, dirty) {
    		if (/*$workspace*/ ctx[0] !== null) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "button svelte-ib2t4a");
    			add_location(div, file$2, 46, 0, 1548);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
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

    function instance$2($$self, $$props, $$invalidate) {
    	let $workspace;
    	let $user;
    	validate_store(workspace, 'workspace');
    	component_subscribe($$self, workspace, $$value => $$invalidate(0, $workspace = $$value));
    	validate_store(user, 'user');
    	component_subscribe($$self, user, $$value => $$invalidate(1, $user = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('WorkspaceSelect', slots, []);

    	const updateWorkspace = async data => {
    		const result = await customFetch.patch(`/workspace/${data.id || $workspace.id}`, data);

    		user.update(user => {
    			user.workspaces = user.workspaces.map(workspace => {
    				if (workspace.id === result.id) {
    					workspace = result;
    				}

    				return workspace;
    			});

    			return user;
    		});
    	};

    	const onSubmit = async e => {
    		const data = parse(e);

    		if (e.submitter.name === "update") {
    			await updateWorkspace(data);
    		} else if (e.submitter.name === "create") {
    			const newWorkspace = await user.newWorkspace();
    			newWorkspace.name = data.name;
    			await updateWorkspace(newWorkspace);
    		}
    	};

    	const deleteWorkspace = async id => {
    		//TODO: Error handling
    		//TODO: Fix bugs with creation and deletion
    		const result = await customFetch.delete(`/workspace/${id}`);

    		if (result.statusCode === 400) {
    			alert("You can't delete a workspace until your todos are done! Finish your work, kid.");
    			return;
    		}

    		user.update(user => {
    			user.workspaces = user.workspaces.filter(workspace => {
    				if (workspace.id === id) {
    					return false;
    				}

    				return true;
    			});

    			return user;
    		});
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<WorkspaceSelect> was created with unknown prop '${key}'`);
    	});

    	const click_handler = userWorkspace => {
    		workspace.set(userWorkspace);
    	};

    	const click_handler_1 = userWorkspace => {
    		deleteWorkspace(userWorkspace.id);
    	};

    	$$self.$capture_state = () => ({
    		user,
    		workspace,
    		parse,
    		customFetch,
    		updateWorkspace,
    		onSubmit,
    		deleteWorkspace,
    		$workspace,
    		$user
    	});

    	return [$workspace, $user, onSubmit, deleteWorkspace, click_handler, click_handler_1];
    }

    class WorkspaceSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "WorkspaceSelect",
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

    // (1:0) <script lang="ts">import Todo from "../components/Todo.svelte";  import Button from "../components/Button.svelte";  import WorkspaceSelect from '../components/WorkspaceSelect.svelte';  import { getEnv }
    function create_catch_block$1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block$1.name,
    		type: "catch",
    		source: "(1:0) <script lang=\\\"ts\\\">import Todo from \\\"../components/Todo.svelte\\\";  import Button from \\\"../components/Button.svelte\\\";  import WorkspaceSelect from '../components/WorkspaceSelect.svelte';  import { getEnv }",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script lang="ts">import Todo from "../components/Todo.svelte";  import Button from "../components/Button.svelte";  import WorkspaceSelect from '../components/WorkspaceSelect.svelte';  import { getEnv }
    function create_then_block$1(ctx) {
    	const block = { c: noop, m: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block$1.name,
    		type: "then",
    		source: "(1:0) <script lang=\\\"ts\\\">import Todo from \\\"../components/Todo.svelte\\\";  import Button from \\\"../components/Button.svelte\\\";  import WorkspaceSelect from '../components/WorkspaceSelect.svelte';  import { getEnv }",
    		ctx
    	});

    	return block;
    }

    // (37:22)     <div>Loading Workspace</div>  {/await}
    function create_pending_block$1(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Loading Workspace";
    			add_location(div, file$1, 37, 2, 1253);
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
    		source: "(37:22)     <div>Loading Workspace</div>  {/await}",
    		ctx
    	});

    	return block;
    }

    // (43:4) {#each $userTodos as todo}
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
    		source: "(43:4) {#each $userTodos as todo}",
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
    	let workspaceselect;
    	let t2;
    	let button0;
    	let t3;
    	let button1;
    	let t4;
    	let button2;
    	let t5;
    	let button3;
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

    	workspaceselect = new WorkspaceSelect({ $$inline: true });

    	button0 = new Button({
    			props: {
    				text: "New Task",
    				onClick: /*newTask*/ ctx[1]
    			},
    			$$inline: true
    		});

    	button1 = new Button({
    			props: {
    				text: "Add Friend To Workspace",
    				onClick: /*addToWorkspaceAlert*/ ctx[3]
    			},
    			$$inline: true
    		});

    	button2 = new Button({
    			props: { text: "Filter", onClick: func },
    			$$inline: true
    		});

    	button3 = new Button({
    			props: {
    				text: "Logout",
    				onClick: /*logout*/ ctx[2]
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
    			create_component(workspaceselect.$$.fragment);
    			t2 = space();
    			create_component(button0.$$.fragment);
    			t3 = space();
    			create_component(button1.$$.fragment);
    			t4 = space();
    			create_component(button2.$$.fragment);
    			t5 = space();
    			create_component(button3.$$.fragment);
    			attr_dev(div0, "class", "col1 svelte-14ntc99");
    			add_location(div0, file$1, 41, 2, 1322);
    			attr_dev(div1, "class", "col2 svelte-14ntc99");
    			add_location(div1, file$1, 46, 2, 1431);
    			attr_dev(div2, "class", "container svelte-14ntc99");
    			add_location(div2, file$1, 40, 0, 1295);
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
    			mount_component(workspaceselect, div1, null);
    			append_dev(div1, t2);
    			mount_component(button0, div1, null);
    			append_dev(div1, t3);
    			mount_component(button1, div1, null);
    			append_dev(div1, t4);
    			mount_component(button2, div1, null);
    			append_dev(div1, t5);
    			mount_component(button3, div1, null);
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
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			transition_in(workspaceselect.$$.fragment, local);
    			transition_in(button0.$$.fragment, local);
    			transition_in(button1.$$.fragment, local);
    			transition_in(button2.$$.fragment, local);
    			transition_in(button3.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			transition_out(workspaceselect.$$.fragment, local);
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			transition_out(button3.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			info.block.d(detaching);
    			info.token = null;
    			info = null;
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div2);
    			destroy_each(each_blocks, detaching);
    			destroy_component(workspaceselect);
    			destroy_component(button0);
    			destroy_component(button1);
    			destroy_component(button2);
    			destroy_component(button3);
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

    const func = () => {
    	
    };

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
    		Todo,
    		Button,
    		WorkspaceSelect,
    		getEnv,
    		user,
    		userTodos,
    		workspace,
    		customFetch,
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

    // (19:4) {:catch err}
    function create_catch_block(ctx) {
    	let div;
    	let t_value = String(/*err*/ ctx[2]) + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			add_location(div, file, 19, 6, 487);
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
    		source: "(19:4) {:catch err}",
    		ctx
    	});

    	return block;
    }

    // (13:4) {:then}
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
    		source: "(13:4) {:then}",
    		ctx
    	});

    	return block;
    }

    // (16:6) {:else}
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
    		source: "(16:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (14:6) {#if $user}
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
    		source: "(14:6) {#if $user}",
    		ctx
    	});

    	return block;
    }

    // (11:25)        <div>Loading...</div>     {:then}
    function create_pending_block(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Loading...";
    			add_location(div, file, 11, 6, 350);
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
    		source: "(11:25)        <div>Loading...</div>     {:then}",
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
    			attr_dev(div0, "class", "max-width-lg svelte-15qbfjq");
    			add_location(div0, file, 9, 2, 291);
    			attr_dev(div1, "class", "outer-container svelte-15qbfjq");
    			add_location(div1, file, 8, 0, 259);
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
