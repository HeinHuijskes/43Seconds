
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function set_store_value(store, ret, value) {
        store.set(value);
        return ret;
    }
    function split_css_unit(value) {
        const split = typeof value === 'string' && value.match(/^\s*(-?[\d.]+)([^\s]*)\s*$/);
        return split ? [parseFloat(split[1]), split[2] || 'px'] : [value, 'px'];
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function get_root_for_style(node) {
        if (!node)
            return document;
        const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
        if (root && root.host) {
            return root;
        }
        return node.ownerDocument;
    }
    function append_empty_stylesheet(node) {
        const style_element = element('style');
        append_stylesheet(get_root_for_style(node), style_element);
        return style_element.sheet;
    }
    function append_stylesheet(node, style) {
        append(node.head || node, style);
        return style.sheet;
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
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
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function to_number(value) {
        return value === '' ? null : +value;
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    // we need to store the information for multiple documents because a Svelte application could also contain iframes
    // https://github.com/sveltejs/svelte/issues/3624
    const managed_styles = new Map();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_style_information(doc, node) {
        const info = { stylesheet: append_empty_stylesheet(node), rules: {} };
        managed_styles.set(doc, info);
        return info;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = get_root_for_style(node);
        const { stylesheet, rules } = managed_styles.get(doc) || create_style_information(doc, node);
        if (!rules[name]) {
            rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            managed_styles.forEach(info => {
                const { ownerNode } = info.stylesheet;
                // there is no ownerNode if it runs on jsdom.
                if (ownerNode)
                    detach(ownerNode);
            });
            managed_styles.clear();
        });
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
    /**
     * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
     * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
     * it can be called from an external module).
     *
     * `onMount` does not run inside a [server-side component](/docs#run-time-server-side-component-api).
     *
     * https://svelte.dev/docs#run-time-svelte-onmount
     */
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
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
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
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
        seen_callbacks.clear();
        set_current_component(saved_component);
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
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
        else if (callback) {
            callback();
        }
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        const options = { direction: 'in' };
        let config = fn(node, params, options);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                started = true;
                delete_rule(node);
                if (is_function(config)) {
                    config = config(options);
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        const options = { direction: 'out' };
        let config = fn(node, params, options);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config(options);
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        const updates = [];
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                // defer updates until all the DOM shuffling is done
                updates.push(() => block.p(child_ctx, dirty));
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
        function insert(block) {
            transition_in(block, 1);
            block.m(node, next);
            lookup.set(block.key, block);
            next = block.first;
            n--;
        }
        while (o && n) {
            const new_block = new_blocks[n - 1];
            const old_block = old_blocks[o - 1];
            const new_key = new_block.key;
            const old_key = old_block.key;
            if (new_block === old_block) {
                // do nothing
                next = new_block.first;
                o--;
                n--;
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        run_all(updates);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
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
            flush_render_callbacks($$.after_update);
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
            ctx: [],
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
            if (!is_function(callback)) {
                return noop;
            }
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.59.2' }, detail), { bubbles: true }));
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
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
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
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
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
    function construct_svelte_component_dev(component, props) {
        const error_message = 'this={...} of <svelte:component> should specify a Svelte component.';
        try {
            const instance = new component(props);
            if (!instance.$$ || !instance.$set || !instance.$on || !instance.$destroy) {
                throw new Error(error_message);
            }
            return instance;
        }
        catch (err) {
            const { message } = err;
            if (typeof message === 'string' && message.indexOf('is not a constructor') !== -1) {
                throw new Error(error_message);
            }
            else {
                throw err;
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
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=} start
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
                if (subscribers.size === 0 && stop) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    const defaultSettings = {pointsToWin: 43};

    const currentGameScreen = writable(null);
    const prevGameScreen = writable(null);
    const game = writable(null);
    const localStorage = writable(null);
    const currentFiveWords = writable(null);
    const settings = writable(defaultSettings);
    function getOrderedTeams() {
        return JSON.parse(JSON.stringify(get_store_value(game))).teams.sort(compareTeamPoints);
    } 

    function getCurrentPlayer() {
        return getCurrentTeam().players[0];
    }
    function getCurrentTeam() {
        const currentTeam = get_store_value(game).round % get_store_value(game).teams.length;
        return get_store_value(game).teams[currentTeam];
    }
    function changeCurrentTeamPoints(pointsToChange) {
        const currentTeam = get_store_value(game).round % get_store_value(game).teams.length;
        get_store_value(game).teams[currentTeam].points += pointsToChange;
        saveGame();
    }
    function goToNextRound() {
        const currentTeamIndex = get_store_value(game).round % get_store_value(game).teams.length;
        get_store_value(game).round += 1;

        let curTurn = get_store_value(game).teams[currentTeamIndex].players[0];
        get_store_value(game).teams[currentTeamIndex].players.push(curTurn);
        get_store_value(game).teams[currentTeamIndex].players.splice(0, 1);
        saveGame();
    }
    function setNextFiveWords() {
        let returnWords = [];
        for(let i = 0; i < 5; i++) {
            const index = Math.floor(Math.random() * Math.floor(get_store_value(game).words.length));
            returnWords.push(get_store_value(game).words[index]);
            get_store_value(game).words.splice(index, 1);
        }
        currentFiveWords.set(returnWords);
    }

    function saveGame() {
        get_store_value(localStorage).setItem('game', JSON.stringify(get_store_value(game)));
    }

    function setDefaultSettings() {
        settings.set(defaultSettings);
        saveSettings();
    }

    function saveSettings() {
        get_store_value(localStorage).setItem('settings', JSON.stringify(get_store_value(settings)));
    }
    function endGame() {
        prevGameScreen.set(Home);
        currentGameScreen.set(Home);
        get_store_value(localStorage).removeItem('game');
        game.set(null);
    }
    function goToHome() {
        prevGameScreen.set(Home);
        currentGameScreen.set(Home);
    }

    function compareTeamPoints(a, b) {
        if (a.points > b.points) return -1;
        if (b.points > a.points) return 1;
      
        return 0;
      }

    function backOut(t) {
        const s = 1.70158;
        return --t * t * ((s + 1) * t + s) + 1;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        const [xValue, xUnit] = split_css_unit(x);
        const [yValue, yUnit] = split_css_unit(y);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * xValue}${xUnit}, ${(1 - t) * yValue}${yUnit});
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src\components\GuessedOverview.svelte generated by Svelte v3.59.2 */
    const file = "src\\components\\GuessedOverview.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (53:24) {:else}
    function create_else_block(ctx) {
    	let h4;
    	let div;
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*word*/ ctx[5] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "class", "form-check-input");
    			attr_dev(input, "type", "checkbox");
    			input.value = "";
    			add_location(input, file, 55, 32, 2444);
    			attr_dev(label, "class", "form-check-label");
    			attr_dev(label, "for", "flexCheckDefault");
    			add_location(label, file, 56, 32, 2536);
    			attr_dev(div, "class", "form-check");
    			add_location(div, file, 54, 28, 2330);
    			attr_dev(h4, "class", "mb-3");
    			add_location(h4, file, 53, 24, 2283);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, div);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(h4, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler_1*/ ctx[3], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentFiveWords*/ 1 && t1_value !== (t1_value = /*word*/ ctx[5] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(53:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (44:24) {#if i == 4}
    function create_if_block(ctx) {
    	let h4;
    	let div;
    	let input;
    	let t0;
    	let label;
    	let t1_value = /*word*/ ctx[5] + "";
    	let t1;
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			div = element("div");
    			input = element("input");
    			t0 = space();
    			label = element("label");
    			t1 = text(t1_value);
    			t2 = space();
    			attr_dev(input, "class", "form-check-input");
    			attr_dev(input, "type", "checkbox");
    			input.value = "";
    			add_location(input, file, 46, 32, 1925);
    			attr_dev(label, "class", "form-check-label");
    			attr_dev(label, "for", "flexCheckDefault");
    			add_location(label, file, 47, 32, 2016);
    			attr_dev(div, "class", "form-check");
    			add_location(div, file, 45, 28, 1815);
    			attr_dev(h4, "class", "");
    			add_location(h4, file, 44, 24, 1772);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, div);
    			append_dev(div, input);
    			append_dev(div, t0);
    			append_dev(div, label);
    			append_dev(label, t1);
    			append_dev(h4, t2);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*click_handler*/ ctx[2], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentFiveWords*/ 1 && t1_value !== (t1_value = /*word*/ ctx[5] + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(44:24) {#if i == 4}",
    		ctx
    	});

    	return block;
    }

    // (43:24) {#each $currentFiveWords as word, i}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[7] == 4) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(43:24) {#each $currentFiveWords as word, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div13;
    	let div12;
    	let div1;
    	let div0;
    	let h50;
    	let t1;
    	let h51;
    	let t3;
    	let div3;
    	let div2;
    	let h52;
    	let t5;
    	let h53;
    	let t7;
    	let div11;
    	let div6;
    	let div5;
    	let div4;
    	let t8;
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let h2;
    	let t9;
    	let i;
    	let div13_intro;
    	let mounted;
    	let dispose;
    	let each_value = /*$currentFiveWords*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div12 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = `${getCurrentTeam().name}`;
    			t1 = space();
    			h51 = element("h5");
    			h51.textContent = `${getCurrentPlayer().name}`;
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			h52 = element("h5");
    			h52.textContent = "Select the";
    			t5 = space();
    			h53 = element("h5");
    			h53.textContent = "guessed words";
    			t7 = space();
    			div11 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t8 = space();
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			h2 = element("h2");
    			t9 = text("Move on ");
    			i = element("i");
    			attr_dev(h50, "class", "c-white mb-0");
    			add_location(h50, file, 28, 16, 1001);
    			attr_dev(h51, "class", "c-white");
    			add_location(h51, file, 29, 16, 1072);
    			attr_dev(div0, "class", "col-12 mb-5 text-center");
    			add_location(div0, file, 27, 12, 946);
    			attr_dev(div1, "class", "row justify-content-center pt-3");
    			add_location(div1, file, 26, 8, 887);
    			attr_dev(h52, "class", "c-white");
    			add_location(h52, file, 34, 16, 1282);
    			attr_dev(h53, "class", "c-white");
    			add_location(h53, file, 35, 16, 1335);
    			attr_dev(div2, "class", "col-12 mb-5 text-center");
    			add_location(div2, file, 33, 12, 1227);
    			attr_dev(div3, "class", "row justify-content-center pt-3");
    			add_location(div3, file, 32, 8, 1168);
    			attr_dev(div4, "class", "card-body text-center c-purple border border-secondary m-3");
    			add_location(div4, file, 41, 20, 1574);
    			attr_dev(div5, "class", "card");
    			add_location(div5, file, 40, 16, 1534);
    			attr_dev(div6, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div6, file, 39, 12, 1478);
    			attr_dev(i, "class", "fas fa-chevron-right");
    			add_location(i, file, 71, 61, 3272);
    			attr_dev(h2, "class", "c-white mb-0");
    			add_location(h2, file, 71, 28, 3239);
    			attr_dev(div7, "class", "card-body text-center");
    			add_location(div7, file, 70, 24, 3174);
    			attr_dev(div8, "class", "card bg-blue");
    			add_location(div8, file, 69, 20, 3048);
    			attr_dev(div9, "class", "col-12 col-md-8 col-lg-6 mt-3");
    			add_location(div9, file, 68, 16, 2983);
    			attr_dev(div10, "class", "row justify-content-center pt-3");
    			add_location(div10, file, 67, 12, 2920);
    			attr_dev(div11, "class", "row justify-content-center pt-3");
    			add_location(div11, file, 38, 8, 1419);
    			attr_dev(div12, "class", "container-fluid");
    			add_location(div12, file, 25, 4, 848);
    			attr_dev(div13, "class", "vertical-center");
    			add_location(div13, file, 24, 0, 806);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div12);
    			append_dev(div12, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t1);
    			append_dev(div0, h51);
    			append_dev(div12, t3);
    			append_dev(div12, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h52);
    			append_dev(div2, t5);
    			append_dev(div2, h53);
    			append_dev(div12, t7);
    			append_dev(div12, div11);
    			append_dev(div11, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			append_dev(div11, t8);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, h2);
    			append_dev(h2, t9);
    			append_dev(h2, i);

    			if (!mounted) {
    				dispose = listen_dev(div8, "click", /*click_handler_2*/ ctx[4], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*changePoints, $currentFiveWords*/ 3) {
    				each_value = /*$currentFiveWords*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (!div13_intro) {
    				add_render_callback(() => {
    					div13_intro = create_in_transition(div13, fly, {});
    					div13_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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
    	let $currentFiveWords;
    	validate_store(currentFiveWords, 'currentFiveWords');
    	component_subscribe($$self, currentFiveWords, $$value => $$invalidate(0, $currentFiveWords = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GuessedOverview', slots, []);

    	function changePoints(inputEvent) {
    		//Get Input if not form-check-input
    		let target = inputEvent.target;

    		if (target.classList.contains('form-check')) {
    			target = target.firstChild;
    			target.checked = !target.checked;
    		} else if (target.classList.contains('form-check-label')) {
    			target = target.parentNode.firstChild;
    			target.checked = !target.checked;
    		}

    		if (target.checked) {
    			changeCurrentTeamPoints(1);
    		} else {
    			changeCurrentTeamPoints(-1);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GuessedOverview> was created with unknown prop '${key}'`);
    	});

    	const click_handler = inputBox => {
    		changePoints(inputBox);
    	};

    	const click_handler_1 = inputEvent => {
    		changePoints(inputEvent);
    	};

    	const click_handler_2 = () => {
    		currentGameScreen.set(InterimScore);
    		goToNextRound();
    	};

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		changeCurrentTeamPoints,
    		getCurrentPlayer,
    		currentFiveWords,
    		goToNextRound,
    		getCurrentTeam,
    		InterimScore,
    		fly,
    		changePoints,
    		$currentFiveWords
    	});

    	return [
    		$currentFiveWords,
    		changePoints,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class GuessedOverview extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GuessedOverview",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src\components\TimeUp.svelte generated by Svelte v3.59.2 */
    const file$1 = "src\\components\\TimeUp.svelte";

    function create_fragment$1(ctx) {
    	let div9;
    	let div8;
    	let div1;
    	let div0;
    	let h50;
    	let t1;
    	let h51;
    	let t3;
    	let div3;
    	let div2;
    	let h52;
    	let t5;
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let h2;
    	let t6;
    	let i;
    	let div9_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div9 = element("div");
    			div8 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = `${getCurrentTeam().name}`;
    			t1 = space();
    			h51 = element("h5");
    			h51.textContent = `${getCurrentPlayer().name}`;
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			h52 = element("h5");
    			h52.textContent = "Time's Up!";
    			t5 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			h2 = element("h2");
    			t6 = text("Move on ");
    			i = element("i");
    			attr_dev(h50, "class", "c-white mb-0");
    			add_location(h50, file$1, 15, 16, 514);
    			attr_dev(h51, "class", "c-white");
    			add_location(h51, file$1, 16, 16, 585);
    			attr_dev(div0, "class", "col-12 mb-5 text-center");
    			add_location(div0, file$1, 14, 12, 459);
    			attr_dev(div1, "class", "row justify-content-center pt-3");
    			add_location(div1, file$1, 13, 8, 400);
    			attr_dev(h52, "class", "c-white");
    			add_location(h52, file$1, 21, 16, 795);
    			attr_dev(div2, "class", "col-12 mb-5 text-center");
    			add_location(div2, file$1, 20, 12, 740);
    			attr_dev(div3, "class", "row justify-content-center pt-3");
    			add_location(div3, file$1, 19, 8, 681);
    			attr_dev(i, "class", "fas fa-chevron-right");
    			add_location(i, file$1, 28, 57, 1180);
    			attr_dev(h2, "class", "c-white mb-0");
    			add_location(h2, file$1, 28, 24, 1147);
    			attr_dev(div4, "class", "card-body text-center");
    			add_location(div4, file$1, 27, 20, 1086);
    			attr_dev(div5, "class", "card bg-blue");
    			add_location(div5, file$1, 26, 16, 996);
    			attr_dev(div6, "class", "col-12 col-md-8 col-lg-6 mb-3");
    			add_location(div6, file$1, 25, 12, 935);
    			attr_dev(div7, "class", "row justify-content-center pt-3");
    			add_location(div7, file$1, 24, 8, 876);
    			attr_dev(div8, "class", "container-fluid");
    			add_location(div8, file$1, 12, 4, 361);
    			attr_dev(div9, "class", "vertical-center");
    			add_location(div9, file$1, 11, 0, 319);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div9, anchor);
    			append_dev(div9, div8);
    			append_dev(div8, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t1);
    			append_dev(div0, h51);
    			append_dev(div8, t3);
    			append_dev(div8, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h52);
    			append_dev(div8, t5);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, h2);
    			append_dev(h2, t6);
    			append_dev(h2, i);

    			if (!mounted) {
    				dispose = listen_dev(div5, "click", /*click_handler*/ ctx[1], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!div9_intro) {
    				add_render_callback(() => {
    					div9_intro = create_in_transition(div9, fly, {});
    					div9_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div9);
    			mounted = false;
    			dispose();
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('TimeUp', slots, []);

    	function checkGuessedOverview() {
    		currentGameScreen.set(GuessedOverview);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<TimeUp> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => checkGuessedOverview();

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		getCurrentPlayer,
    		getCurrentTeam,
    		GuessedOverview,
    		fly,
    		checkGuessedOverview
    	});

    	return [checkGuessedOverview, click_handler];
    }

    class TimeUp extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TimeUp",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src\components\GuessScreen.svelte generated by Svelte v3.59.2 */
    const file$2 = "src\\components\\GuessScreen.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (49:24) {:else}
    function create_else_block$1(ctx) {
    	let h4;
    	let t_value = /*word*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(t_value);
    			attr_dev(h4, "class", "mb-3");
    			add_location(h4, file$2, 49, 24, 1723);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentFiveWords*/ 2 && t_value !== (t_value = /*word*/ ctx[6] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(49:24) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:24) {#if i == 4}
    function create_if_block$1(ctx) {
    	let h4;
    	let t_value = /*word*/ ctx[6] + "";
    	let t;

    	const block = {
    		c: function create() {
    			h4 = element("h4");
    			t = text(t_value);
    			attr_dev(h4, "class", "");
    			add_location(h4, file$2, 47, 24, 1640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h4, anchor);
    			append_dev(h4, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$currentFiveWords*/ 2 && t_value !== (t_value = /*word*/ ctx[6] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h4);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(47:24) {#if i == 4}",
    		ctx
    	});

    	return block;
    }

    // (46:24) {#each $currentFiveWords as word, i}
    function create_each_block$1(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*i*/ ctx[8] == 4) return create_if_block$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if_block.p(ctx, dirty);
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(46:24) {#each $currentFiveWords as word, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div13;
    	let div12;
    	let div1;
    	let div0;
    	let h50;
    	let t1;
    	let h51;
    	let t3;
    	let div3;
    	let div2;
    	let h52;
    	let t4;
    	let t5;
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let t6;
    	let div11;
    	let div10;
    	let div9;
    	let div8;
    	let h2;
    	let t7;
    	let i;
    	let div13_intro;
    	let mounted;
    	let dispose;
    	let each_value = /*$currentFiveWords*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div13 = element("div");
    			div12 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h50 = element("h5");
    			h50.textContent = `${getCurrentTeam().name}`;
    			t1 = space();
    			h51 = element("h5");
    			h51.textContent = `${getCurrentPlayer().name}`;
    			t3 = space();
    			div3 = element("div");
    			div2 = element("div");
    			h52 = element("h5");
    			t4 = text(/*turnSecondsLeft*/ ctx[0]);
    			t5 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			h2 = element("h2");
    			t7 = text("End Turn ");
    			i = element("i");
    			attr_dev(h50, "class", "c-white mb-0");
    			add_location(h50, file$2, 32, 16, 918);
    			attr_dev(h51, "class", "c-white");
    			add_location(h51, file$2, 33, 16, 989);
    			attr_dev(div0, "class", "col-12 mb-5 text-center");
    			add_location(div0, file$2, 31, 12, 863);
    			attr_dev(div1, "class", "row justify-content-center pt-3");
    			add_location(div1, file$2, 30, 8, 804);
    			attr_dev(h52, "class", "c-white");
    			add_location(h52, file$2, 38, 16, 1199);
    			attr_dev(div2, "class", "col-12 mb-5 text-center");
    			add_location(div2, file$2, 37, 12, 1144);
    			attr_dev(div3, "class", "row justify-content-center pt-3");
    			add_location(div3, file$2, 36, 8, 1085);
    			attr_dev(div4, "class", "card-body text-center c-purple border border-secondary m-3");
    			add_location(div4, file$2, 44, 20, 1442);
    			attr_dev(div5, "class", "card");
    			add_location(div5, file$2, 43, 16, 1402);
    			attr_dev(div6, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div6, file$2, 42, 12, 1346);
    			attr_dev(div7, "class", "row justify-content-center pt-3");
    			add_location(div7, file$2, 41, 8, 1287);
    			attr_dev(i, "class", "fas fa-chevron-right");
    			add_location(i, file$2, 60, 58, 2195);
    			attr_dev(h2, "class", "c-white mb-0");
    			add_location(h2, file$2, 60, 24, 2161);
    			attr_dev(div8, "class", "py-2 text-center");
    			add_location(div8, file$2, 59, 20, 2105);
    			attr_dev(div9, "class", "card bg-blue");
    			add_location(div9, file$2, 58, 16, 2023);
    			attr_dev(div10, "class", "col-8 col-lg-3 mb-3");
    			add_location(div10, file$2, 57, 12, 1972);
    			attr_dev(div11, "class", "row justify-content-center pt-5");
    			add_location(div11, file$2, 56, 8, 1913);
    			attr_dev(div12, "class", "container-fluid");
    			add_location(div12, file$2, 29, 4, 765);
    			attr_dev(div13, "class", "vertical-center");
    			add_location(div13, file$2, 28, 0, 723);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div13, anchor);
    			append_dev(div13, div12);
    			append_dev(div12, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h50);
    			append_dev(div0, t1);
    			append_dev(div0, h51);
    			append_dev(div12, t3);
    			append_dev(div12, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h52);
    			append_dev(h52, t4);
    			append_dev(div12, t5);
    			append_dev(div12, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			append_dev(div12, t6);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, h2);
    			append_dev(h2, t7);
    			append_dev(h2, i);

    			if (!mounted) {
    				dispose = listen_dev(div9, "click", /*click_handler*/ ctx[3], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*turnSecondsLeft*/ 1) set_data_dev(t4, /*turnSecondsLeft*/ ctx[0]);

    			if (dirty & /*$currentFiveWords*/ 2) {
    				each_value = /*$currentFiveWords*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (!div13_intro) {
    				add_render_callback(() => {
    					div13_intro = create_in_transition(div13, fly, {});
    					div13_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div13);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
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
    	let $currentFiveWords;
    	validate_store(currentFiveWords, 'currentFiveWords');
    	component_subscribe($$self, currentFiveWords, $$value => $$invalidate(1, $currentFiveWords = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('GuessScreen', slots, []);
    	let turnSecondsLeft = 43;

    	let gameTimer = setInterval(
    		function () {
    			if (turnSecondsLeft <= 1) {
    				goToTimeUp();
    			} else {
    				$$invalidate(0, turnSecondsLeft -= 1);
    			}
    		},
    		1000
    	);

    	function goToTimeUp() {
    		clearInterval(gameTimer);
    		currentGameScreen.set(TimeUp);
    	}

    	function endTurnPress() {
    		if (confirm('Are you sure you want to end your turn?')) {
    			goToTimeUp();
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<GuessScreen> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => endTurnPress();

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		getCurrentPlayer,
    		currentFiveWords,
    		getCurrentTeam,
    		TimeUp,
    		fly,
    		turnSecondsLeft,
    		gameTimer,
    		goToTimeUp,
    		endTurnPress,
    		$currentFiveWords
    	});

    	$$self.$inject_state = $$props => {
    		if ('turnSecondsLeft' in $$props) $$invalidate(0, turnSecondsLeft = $$props.turnSecondsLeft);
    		if ('gameTimer' in $$props) gameTimer = $$props.gameTimer;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [turnSecondsLeft, $currentFiveWords, endTurnPress, click_handler];
    }

    class GuessScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "GuessScreen",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src\components\Credits.svelte generated by Svelte v3.59.2 */
    const file$3 = "src\\components\\Credits.svelte";

    function create_fragment$3(ctx) {
    	let div15;
    	let div14;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let div4;
    	let div3;
    	let h1;
    	let i1;
    	let t1;
    	let i2;
    	let t2;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let div9;
    	let div6;
    	let div5;
    	let h5;
    	let t4;
    	let div8;
    	let div7;
    	let span0;
    	let t5;
    	let small0;
    	let t7;
    	let span1;
    	let t8;
    	let small1;
    	let t10;
    	let span2;
    	let t11;
    	let small2;
    	let t13;
    	let span3;
    	let t14;
    	let small3;
    	let div15_intro;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div15 = element("div");
    			div14 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			h1 = element("h1");
    			i1 = element("i");
    			t1 = text(" Wall of Fame ");
    			i2 = element("i");
    			t2 = space();
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Words";
    			t4 = space();
    			div8 = element("div");
    			div7 = element("div");
    			span0 = element("span");
    			t5 = text("No-one ");
    			small0 = element("small");
    			small0.textContent = "(1)";
    			t7 = space();
    			span1 = element("span");
    			t8 = text("No-one ");
    			small1 = element("small");
    			small1.textContent = "(1)";
    			t10 = space();
    			span2 = element("span");
    			t11 = text("No-one ");
    			small2 = element("small");
    			small2.textContent = "(1)";
    			t13 = space();
    			span3 = element("span");
    			t14 = text("No-one ");
    			small3 = element("small");
    			small3.textContent = "(1)";
    			attr_dev(i0, "class", "c-white fas fa-times");
    			add_location(i0, file$3, 12, 20, 496);
    			attr_dev(div0, "class", "float-end");
    			add_location(div0, file$3, 11, 16, 400);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$3, 10, 12, 362);
    			attr_dev(div2, "class", "row mb-3");
    			add_location(div2, file$3, 9, 8, 326);
    			attr_dev(i1, "class", "fas fa-crown");
    			add_location(i1, file$3, 18, 36, 703);
    			attr_dev(i2, "class", "fas fa-crown");
    			add_location(i2, file$3, 18, 78, 745);
    			attr_dev(h1, "class", "c-white");
    			add_location(h1, file$3, 18, 16, 683);
    			attr_dev(div3, "class", "col-12 text-center");
    			add_location(div3, file$3, 17, 12, 633);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$3, 16, 8, 602);
    			add_location(h5, file$3, 29, 36, 1236);
    			attr_dev(div5, "class", "col-12");
    			add_location(div5, file$3, 28, 32, 1178);
    			attr_dev(div6, "class", "row mb-2 justify-content-center");
    			add_location(div6, file$3, 27, 28, 1099);
    			add_location(small0, file$3, 34, 65, 1522);
    			attr_dev(span0, "class", "d-block");
    			add_location(span0, file$3, 34, 36, 1493);
    			add_location(small1, file$3, 35, 65, 1614);
    			attr_dev(span1, "class", "d-block");
    			add_location(span1, file$3, 35, 36, 1585);
    			add_location(small2, file$3, 36, 65, 1706);
    			attr_dev(span2, "class", "d-block");
    			add_location(span2, file$3, 36, 36, 1677);
    			add_location(small3, file$3, 37, 65, 1798);
    			attr_dev(span3, "class", "d-block");
    			add_location(span3, file$3, 37, 36, 1769);
    			attr_dev(div7, "class", "col-12");
    			add_location(div7, file$3, 33, 32, 1435);
    			attr_dev(div8, "class", "row mb-2 justify-content-center");
    			add_location(div8, file$3, 32, 28, 1356);
    			attr_dev(div9, "class", "card-body text-center");
    			add_location(div9, file$3, 26, 24, 1034);
    			attr_dev(div10, "class", "card mb-3");
    			add_location(div10, file$3, 25, 20, 985);
    			attr_dev(div11, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div11, file$3, 24, 16, 925);
    			attr_dev(div12, "class", "row justify-content-center");
    			add_location(div12, file$3, 23, 12, 867);
    			attr_dev(div13, "class", "container");
    			add_location(div13, file$3, 22, 8, 830);
    			attr_dev(div14, "class", "container-fluid pt-2 vh-100 bg-purple");
    			add_location(div14, file$3, 8, 4, 265);
    			add_location(div15, file$3, 7, 0, 247);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div15, anchor);
    			append_dev(div15, div14);
    			append_dev(div14, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div14, t0);
    			append_dev(div14, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h1);
    			append_dev(h1, i1);
    			append_dev(h1, t1);
    			append_dev(h1, i2);
    			append_dev(div14, t2);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h5);
    			append_dev(div9, t4);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, span0);
    			append_dev(span0, t5);
    			append_dev(span0, small0);
    			append_dev(div7, t7);
    			append_dev(div7, span1);
    			append_dev(span1, t8);
    			append_dev(span1, small1);
    			append_dev(div7, t10);
    			append_dev(div7, span2);
    			append_dev(span2, t11);
    			append_dev(span2, small2);
    			append_dev(div7, t13);
    			append_dev(div7, span3);
    			append_dev(span3, t14);
    			append_dev(span3, small3);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler*/ ctx[0], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (!div15_intro) {
    				add_render_callback(() => {
    					div15_intro = create_in_transition(div15, fly, {});
    					div15_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div15);
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
    	validate_slots('Credits', slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Credits> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => currentGameScreen.set(Settings);

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		game,
    		settings,
    		saveSettings,
    		endGame,
    		prevGameScreen,
    		goToHome,
    		Settings,
    		fly
    	});

    	return [click_handler];
    }

    class Credits extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Credits",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src\components\Settings.svelte generated by Svelte v3.59.2 */
    const file$4 = "src\\components\\Settings.svelte";

    // (51:12) {#if $game != null}
    function create_if_block$2(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let h3;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h3 = element("h3");
    			h3.textContent = "End Game";
    			attr_dev(h3, "class", "c-white mb-0");
    			add_location(h3, file$4, 55, 28, 2477);
    			attr_dev(div0, "class", "card-body text-center");
    			add_location(div0, file$4, 54, 24, 2412);
    			attr_dev(div1, "class", "card bg-red");
    			add_location(div1, file$4, 53, 20, 2332);
    			attr_dev(div2, "class", "col-12 col-md-8 col-lg-6 mb-3");
    			add_location(div2, file$4, 52, 16, 2267);
    			attr_dev(div3, "class", "row justify-content-center");
    			add_location(div3, file$4, 51, 12, 2209);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h3);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler_2*/ ctx[8], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(51:12) {#if $game != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div22;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let div4;
    	let div3;
    	let h1;
    	let t2;
    	let div21;
    	let div10;
    	let div9;
    	let div8;
    	let div7;
    	let div6;
    	let div5;
    	let label;
    	let t4;
    	let input;
    	let t5;
    	let div14;
    	let div13;
    	let div12;
    	let div11;
    	let h30;
    	let t7;
    	let t8;
    	let div18;
    	let div17;
    	let div16;
    	let div15;
    	let h31;
    	let t10;
    	let div20;
    	let div19;
    	let button;
    	let i1;
    	let t11;
    	let i2;
    	let t12;
    	let a0;
    	let t14;
    	let h60;
    	let t15;
    	let i3;
    	let t16;
    	let a1;
    	let t18;
    	let h61;
    	let t19;
    	let a2;
    	let t20;
    	let i4;
    	let t22;
    	let a3;
    	let div22_intro;
    	let mounted;
    	let dispose;
    	let if_block = /*$game*/ ctx[2] != null && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div22 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Settings";
    			t2 = space();
    			div21 = element("div");
    			div10 = element("div");
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			label = element("label");
    			label.textContent = "Points goal:";
    			t4 = space();
    			input = element("input");
    			t5 = space();
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Home";
    			t7 = space();
    			if (if_block) if_block.c();
    			t8 = space();
    			div18 = element("div");
    			div17 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Standard Settings";
    			t10 = space();
    			div20 = element("div");
    			div19 = element("div");
    			button = element("button");
    			i1 = element("i");
    			t11 = text(" Wall of Fame ");
    			i2 = element("i");
    			t12 = space();
    			a0 = element("a");
    			a0.textContent = "GitHub Link";
    			t14 = space();
    			h60 = element("h6");
    			t15 = text("Made with ");
    			i3 = element("i");
    			t16 = text(" by ");
    			a1 = element("a");
    			a1.textContent = "Mardy";
    			t18 = space();
    			h61 = element("h6");
    			t19 = text("Adapted for the 43rd Dies of ");
    			a2 = element("a");
    			t20 = text("Inter-");
    			i4 = element("i");
    			i4.textContent = "Actief";
    			t22 = text(" by ");
    			a3 = element("a");
    			a3.textContent = "Hein";
    			attr_dev(i0, "class", "c-white fas fa-times");
    			add_location(i0, file$4, 14, 20, 577);
    			attr_dev(div0, "class", "float-end");
    			add_location(div0, file$4, 13, 16, 474);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$4, 12, 12, 436);
    			attr_dev(div2, "class", "row mb-3");
    			add_location(div2, file$4, 11, 8, 400);
    			attr_dev(h1, "class", "c-white");
    			add_location(h1, file$4, 20, 16, 764);
    			attr_dev(div3, "class", "col-12 text-center");
    			add_location(div3, file$4, 19, 12, 714);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$4, 18, 8, 683);
    			attr_dev(label, "for", "pointsGoal");
    			attr_dev(label, "class", "form-label");
    			add_location(label, file$4, 32, 36, 1257);
    			attr_dev(input, "inputmode", "numeric");
    			attr_dev(input, "pattern", "[0-9]*");
    			attr_dev(input, "type", "number");
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "id", "pointsGoal");
    			add_location(input, file$4, 33, 36, 1358);
    			attr_dev(div5, "class", "col-12");
    			add_location(div5, file$4, 31, 32, 1199);
    			attr_dev(div6, "class", "row mb-2 justify-content-center");
    			add_location(div6, file$4, 30, 28, 1120);
    			attr_dev(div7, "class", "card-body");
    			add_location(div7, file$4, 29, 24, 1067);
    			attr_dev(div8, "class", "card mb-3");
    			add_location(div8, file$4, 28, 20, 1018);
    			attr_dev(div9, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div9, file$4, 27, 16, 958);
    			attr_dev(div10, "class", "row justify-content-center");
    			add_location(div10, file$4, 26, 12, 900);
    			attr_dev(h30, "class", "c-white mb-0");
    			add_location(h30, file$4, 45, 28, 2024);
    			attr_dev(div11, "class", "card-body text-center");
    			add_location(div11, file$4, 44, 24, 1959);
    			attr_dev(div12, "class", "card bg-blue");
    			add_location(div12, file$4, 43, 20, 1877);
    			attr_dev(div13, "class", "col-12 col-md-8 col-lg-6 mb-3");
    			add_location(div13, file$4, 42, 16, 1812);
    			attr_dev(div14, "class", "row justify-content-center");
    			add_location(div14, file$4, 41, 12, 1754);
    			attr_dev(h31, "class", "c-white mb-0");
    			add_location(h31, file$4, 65, 28, 2931);
    			attr_dev(div15, "class", "card-body text-center");
    			add_location(div15, file$4, 64, 24, 2866);
    			attr_dev(div16, "class", "card bg-red");
    			add_location(div16, file$4, 63, 20, 2775);
    			attr_dev(div17, "class", "col-12 col-md-8 col-lg-6 mb-3");
    			add_location(div17, file$4, 62, 16, 2710);
    			attr_dev(div18, "class", "row justify-content-center");
    			add_location(div18, file$4, 61, 12, 2652);
    			attr_dev(i1, "class", "fas fa-crown");
    			add_location(i1, file$4, 73, 139, 3324);
    			attr_dev(i2, "class", "fas fa-crown");
    			add_location(i2, file$4, 73, 181, 3366);
    			attr_dev(button, "class", "btn btn-small bg-blue c-white d-block mx-auto mb-2");
    			add_location(button, file$4, 73, 20, 3205);
    			attr_dev(a0, "href", "https://github.com/HeinHuijskes/43Seconds");
    			attr_dev(a0, "class", "white-link svelte-zhpjbd");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$4, 74, 20, 3425);
    			attr_dev(i3, "class", "fas fa-heart mt-4 svelte-zhpjbd");
    			add_location(i3, file$4, 76, 34, 3585);
    			attr_dev(a1, "class", "white-link svelte-zhpjbd");
    			attr_dev(a1, "href", "https://github.com/TheMardy");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$4, 76, 71, 3622);
    			add_location(h60, file$4, 76, 20, 3571);
    			add_location(i4, file$4, 77, 141, 3852);
    			attr_dev(a2, "class", "white-link svelte-zhpjbd");
    			attr_dev(a2, "href", "https://www.inter-actief.utwente.nl/");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$4, 77, 53, 3764);
    			attr_dev(a3, "class", "white-link svelte-zhpjbd");
    			attr_dev(a3, "href", "https://github.com/HeinHuijskes");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$4, 77, 162, 3873);
    			add_location(h61, file$4, 77, 20, 3731);
    			attr_dev(div19, "class", "col-12 c-white text-center");
    			add_location(div19, file$4, 72, 16, 3143);
    			attr_dev(div20, "class", "row mb-4 mt-5");
    			add_location(div20, file$4, 71, 12, 3098);
    			attr_dev(div21, "class", "container");
    			add_location(div21, file$4, 24, 8, 849);
    			attr_dev(div22, "class", "container-fluid pt-2 vh-100 bg-purple");
    			add_location(div22, file$4, 10, 4, 331);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div22, anchor);
    			append_dev(div22, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div22, t0);
    			append_dev(div22, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h1);
    			append_dev(div22, t2);
    			append_dev(div22, div21);
    			append_dev(div21, div10);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, label);
    			append_dev(div5, t4);
    			append_dev(div5, input);
    			set_input_value(input, /*$settings*/ ctx[1].pointsToWin);
    			append_dev(div21, t5);
    			append_dev(div21, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, h30);
    			append_dev(div21, t7);
    			if (if_block) if_block.m(div21, null);
    			append_dev(div21, t8);
    			append_dev(div21, div18);
    			append_dev(div18, div17);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, h31);
    			append_dev(div21, t10);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, button);
    			append_dev(button, i1);
    			append_dev(button, t11);
    			append_dev(button, i2);
    			append_dev(div19, t12);
    			append_dev(div19, a0);
    			append_dev(div19, t14);
    			append_dev(div19, h60);
    			append_dev(h60, t15);
    			append_dev(h60, i3);
    			append_dev(h60, t16);
    			append_dev(h60, a1);
    			append_dev(div19, t18);
    			append_dev(div19, h61);
    			append_dev(h61, t19);
    			append_dev(h61, a2);
    			append_dev(a2, t20);
    			append_dev(a2, i4);
    			append_dev(h61, t22);
    			append_dev(h61, a3);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[4], false, false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[5]),
    					listen_dev(input, "change", /*change_handler*/ ctx[6], false, false, false, false),
    					listen_dev(div12, "click", /*click_handler_1*/ ctx[7], false, false, false, false),
    					listen_dev(div16, "click", /*click_handler_3*/ ctx[9], false, false, false, false),
    					listen_dev(button, "click", /*click_handler_4*/ ctx[10], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$settings*/ 2 && to_number(input.value) !== /*$settings*/ ctx[1].pointsToWin) {
    				set_input_value(input, /*$settings*/ ctx[1].pointsToWin);
    			}

    			if (/*$game*/ ctx[2] != null) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					if_block.m(div21, t8);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: function intro(local) {
    			if (!div22_intro) {
    				add_render_callback(() => {
    					div22_intro = create_in_transition(div22, fly, {});
    					div22_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div22);
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
    	let $prevGameScreen;
    	let $settings;
    	let $game;
    	validate_store(prevGameScreen, 'prevGameScreen');
    	component_subscribe($$self, prevGameScreen, $$value => $$invalidate(0, $prevGameScreen = $$value));
    	validate_store(settings, 'settings');
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	validate_store(game, 'game');
    	component_subscribe($$self, game, $$value => $$invalidate(2, $game = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Settings', slots, []);

    	function changeGoal() {
    		saveSettings();
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Settings> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => currentGameScreen.set($prevGameScreen);

    	function input_input_handler() {
    		$settings.pointsToWin = to_number(this.value);
    		settings.set($settings);
    	}

    	const change_handler = () => changeGoal();
    	const click_handler_1 = () => goToHome();
    	const click_handler_2 = () => endGame();
    	const click_handler_3 = () => setDefaultSettings();

    	const click_handler_4 = () => {
    		currentGameScreen.set(Credits);
    	};

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		game,
    		settings,
    		saveSettings,
    		endGame,
    		prevGameScreen,
    		goToHome,
    		setDefaultSettings,
    		Credits,
    		fly,
    		changeGoal,
    		$prevGameScreen,
    		$settings,
    		$game
    	});

    	return [
    		$prevGameScreen,
    		$settings,
    		$game,
    		changeGoal,
    		click_handler,
    		input_input_handler,
    		change_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Settings extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Settings",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src\components\Toast.svelte generated by Svelte v3.59.2 */
    const file$5 = "src\\components\\Toast.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (54:1) {#each toasts as toast (toast._id)}
    function create_each_block$2(key_1, ctx) {
    	let div;
    	let t0_value = /*toast*/ ctx[6].msg + "";
    	let t0;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "toast-item svelte-1b81f4w");
    			add_location(div, file$5, 54, 1, 988);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*toasts*/ 1) && t0_value !== (t0_value = /*toast*/ ctx[6].msg + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!current) return;
    				if (div_outro) div_outro.end(1);

    				div_intro = create_in_transition(div, fly, {
    					delay: 0,
    					duration: 300,
    					x: 0,
    					y: 50,
    					opacity: 0.1,
    					easing: backOut
    				});

    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 500, opacity: 0 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(54:1) {#each toasts as toast (toast._id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*toasts*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*toast*/ ctx[6]._id;
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "toast-wrapper svelte-1b81f4w");
    			add_location(div, file$5, 52, 0, 920);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div, null);
    				}
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*toasts*/ 1) {
    				each_value = /*toasts*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block$2, null, get_each_context$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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
    	validate_slots('Toast', slots, []);
    	let toasts = [];
    	let retainMs = 3500;
    	let toastId = 0;

    	const pushToast = (msg = '') => {
    		$$invalidate(0, toasts = [...toasts, { _id: ++toastId, msg }]);

    		setTimeout(
    			() => {
    				unshiftToast();
    			},
    			retainMs
    		);
    	};

    	const unshiftToast = () => {
    		$$invalidate(0, toasts = toasts.filter((a, i) => i > 0));
    	};

    	const clearToasts = () => {
    		$$invalidate(0, toasts = []);
    	};

    	onMount(() => {
    		window.pushToast = pushToast;
    		window.clearToasts = clearToasts;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Toast> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		fly,
    		backOut,
    		toasts,
    		retainMs,
    		toastId,
    		pushToast,
    		unshiftToast,
    		clearToasts
    	});

    	$$self.$inject_state = $$props => {
    		if ('toasts' in $$props) $$invalidate(0, toasts = $$props.toasts);
    		if ('retainMs' in $$props) retainMs = $$props.retainMs;
    		if ('toastId' in $$props) toastId = $$props.toastId;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toasts];
    }

    class Toast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toast",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src\components\InterimScore.svelte generated by Svelte v3.59.2 */
    const file$6 = "src\\components\\InterimScore.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (56:12) {:else}
    function create_else_block_1(ctx) {
    	let div1;
    	let div0;
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let h12;
    	let t5;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let h2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Hand me";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = "over to";
    			t3 = space();
    			h12 = element("h1");
    			h12.textContent = `${getCurrentPlayer().name}`;
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Start the time";
    			attr_dev(h10, "class", "c-white mb-0");
    			add_location(h10, file$6, 58, 20, 2294);
    			attr_dev(h11, "class", "c-white mb-0");
    			add_location(h11, file$6, 59, 20, 2353);
    			attr_dev(h12, "class", "c-white mb-0");
    			add_location(h12, file$6, 60, 20, 2412);
    			attr_dev(div0, "class", "col-12 col-md-8 col-lg-6 mb-5 text-center");
    			add_location(div0, file$6, 57, 16, 2217);
    			attr_dev(div1, "class", "row justify-content-center pt-3");
    			add_location(div1, file$6, 56, 12, 2154);
    			attr_dev(h2, "class", "c-white mb-0");
    			add_location(h2, file$6, 67, 28, 2801);
    			attr_dev(div2, "class", "card-body text-center");
    			add_location(div2, file$6, 66, 24, 2736);
    			attr_dev(div3, "class", "card bg-blue");
    			add_location(div3, file$6, 65, 20, 2653);
    			attr_dev(div4, "class", "col-12 col-md-8 col-lg-6 mb-3");
    			add_location(div4, file$6, 64, 16, 2588);
    			attr_dev(div5, "class", "row justify-content-center pt-3");
    			add_location(div5, file$6, 63, 12, 2525);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, h11);
    			append_dev(div0, t3);
    			append_dev(div0, h12);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h2);

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", /*click_handler_2*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(56:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (39:12) {#if getTurn() == 0 && getOrderedTeams()[0].points >= $settings.pointsToWin}
    function create_if_block_1(ctx) {
    	let div1;
    	let div0;
    	let h10;
    	let t1;
    	let h11;
    	let t3;
    	let h12;
    	let i0;
    	let t4;
    	let i1;
    	let t5;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let h2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			h10 = element("h1");
    			h10.textContent = "Team";
    			t1 = space();
    			h11 = element("h1");
    			h11.textContent = `${getOrderedTeams()[0].name}`;
    			t3 = space();
    			h12 = element("h1");
    			i0 = element("i");
    			t4 = text(" Has Won! ");
    			i1 = element("i");
    			t5 = space();
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			h2 = element("h2");
    			h2.textContent = "The End";
    			attr_dev(h10, "class", "c-white mb-0");
    			add_location(h10, file$6, 41, 20, 1423);
    			attr_dev(h11, "class", "c-white mb-0");
    			add_location(h11, file$6, 42, 20, 1479);
    			attr_dev(i0, "class", "fas fa-award");
    			add_location(i0, file$6, 43, 45, 1583);
    			attr_dev(i1, "class", "fas fa-award");
    			add_location(i1, file$6, 43, 83, 1621);
    			attr_dev(h12, "class", "c-white mb-0");
    			add_location(h12, file$6, 43, 20, 1558);
    			attr_dev(div0, "class", "col-12 col-md-8 col-lg-6 mb-5 text-center");
    			add_location(div0, file$6, 40, 16, 1346);
    			attr_dev(div1, "class", "row justify-content-center pt-3");
    			add_location(div1, file$6, 39, 12, 1283);
    			attr_dev(h2, "class", "c-white mb-0");
    			add_location(h2, file$6, 50, 28, 1978);
    			attr_dev(div2, "class", "py-2 text-center");
    			add_location(div2, file$6, 49, 24, 1918);
    			attr_dev(div3, "class", "card bg-red");
    			add_location(div3, file$6, 48, 20, 1838);
    			attr_dev(div4, "class", "col-8 col-lg-3 mb-3");
    			add_location(div4, file$6, 47, 20, 1783);
    			attr_dev(div5, "class", "row justify-content-center pt-3");
    			add_location(div5, file$6, 46, 16, 1716);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, h10);
    			append_dev(div0, t1);
    			append_dev(div0, h11);
    			append_dev(div0, t3);
    			append_dev(div0, h12);
    			append_dev(h12, i0);
    			append_dev(h12, t4);
    			append_dev(h12, i1);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h2);

    			if (!mounted) {
    				dispose = listen_dev(div3, "click", /*click_handler_1*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(div5);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(39:12) {#if getTurn() == 0 && getOrderedTeams()[0].points >= $settings.pointsToWin}",
    		ctx
    	});

    	return block;
    }

    // (83:28) {:else}
    function create_else_block$2(ctx) {
    	let h5;
    	let t0_value = /*i*/ ctx[11] + 1 + "";
    	let t0;
    	let t1;
    	let t2_value = /*team*/ ctx[9].name + "";
    	let t2;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(h5, "class", "float-start d-inline");
    			add_location(h5, file$6, 83, 28, 3776);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			append_dev(h5, t1);
    			append_dev(h5, t2);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(83:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (81:28) {#if team.name == getCurrentTeam().name && getOrderedTeams()[0].points < $settings.pointsToWin}
    function create_if_block$3(ctx) {
    	let h5;
    	let t0_value = /*i*/ ctx[11] + 1 + "";
    	let t0;
    	let t1;
    	let t2_value = /*team*/ ctx[9].name + "";
    	let t2;
    	let t3;
    	let i;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			i = element("i");
    			attr_dev(i, "class", "far fa-play-circle");
    			add_location(i, file$6, 81, 79, 3670);
    			attr_dev(h5, "class", "float-start d-inline");
    			add_location(h5, file$6, 81, 28, 3619);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			append_dev(h5, t1);
    			append_dev(h5, t2);
    			append_dev(h5, t3);
    			append_dev(h5, i);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(81:28) {#if team.name == getCurrentTeam().name && getOrderedTeams()[0].points < $settings.pointsToWin}",
    		ctx
    	});

    	return block;
    }

    // (80:28) {#each getOrderedTeams() as team, i}
    function create_each_block$3(ctx) {
    	let show_if;
    	let t0;
    	let h5;
    	let t1_value = /*team*/ ctx[9].points + "";
    	let t1;
    	let t2;
    	let div;
    	let t3;
    	let hr;

    	function select_block_type_1(ctx, dirty) {
    		if (dirty & /*$settings*/ 2) show_if = null;
    		if (show_if == null) show_if = !!(/*team*/ ctx[9].name == getCurrentTeam().name && getOrderedTeams()[0].points < /*$settings*/ ctx[1].pointsToWin);
    		if (show_if) return create_if_block$3;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type_1(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			t0 = space();
    			h5 = element("h5");
    			t1 = text(t1_value);
    			t2 = space();
    			div = element("div");
    			t3 = space();
    			hr = element("hr");
    			attr_dev(h5, "class", "float-end d-inline");
    			add_location(h5, file$6, 85, 28, 3897);
    			attr_dev(div, "class", "clearfix");
    			add_location(div, file$6, 86, 28, 3976);
    			attr_dev(hr, "class", "mt-0 mb-4");
    			add_location(hr, file$6, 87, 28, 4034);
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, div, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(80:28) {#each getOrderedTeams() as team, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div10;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let i;
    	let t0;
    	let div9;
    	let div8;
    	let show_if;
    	let t1;
    	let div7;
    	let div6;
    	let div5;
    	let div4;
    	let h5;
    	let t2;
    	let t3_value = /*getGameRound*/ ctx[3]() + "";
    	let t3;
    	let t4;
    	let small;
    	let t5;
    	let t6_value = /*getTurn*/ ctx[4]() + 1 + "";
    	let t6;
    	let t7;
    	let t8_value = /*$game*/ ctx[0].teams.length + "";
    	let t8;
    	let t9;
    	let t10;
    	let h6;
    	let t12;
    	let div10_intro;
    	let t13;
    	let toast;
    	let current;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*$settings*/ 2) show_if = null;
    		if (show_if == null) show_if = !!(/*getTurn*/ ctx[4]() == 0 && getOrderedTeams()[0].points >= /*$settings*/ ctx[1].pointsToWin);
    		if (show_if) return create_if_block_1;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);
    	let each_value = getOrderedTeams();
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	toast = new Toast({ $$inline: true });

    	const block = {
    		c: function create() {
    			div10 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			div9 = element("div");
    			div8 = element("div");
    			if_block.c();
    			t1 = space();
    			div7 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			h5 = element("h5");
    			t2 = text("Round ");
    			t3 = text(t3_value);
    			t4 = space();
    			small = element("small");
    			t5 = text("(");
    			t6 = text(t6_value);
    			t7 = text("/");
    			t8 = text(t8_value);
    			t9 = text(")");
    			t10 = space();
    			h6 = element("h6");
    			h6.textContent = "the score";
    			t12 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t13 = space();
    			create_component(toast.$$.fragment);
    			attr_dev(i, "class", "c-white fas fa-cog");
    			add_location(i, file$6, 31, 20, 999);
    			attr_dev(div0, "class", "float-end");
    			add_location(div0, file$6, 30, 16, 903);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$6, 29, 12, 865);
    			attr_dev(div2, "class", "row mb-3");
    			add_location(div2, file$6, 28, 8, 829);
    			attr_dev(div3, "class", "container-fluid pt-2");
    			add_location(div3, file$6, 27, 4, 785);
    			add_location(small, file$6, 77, 72, 3267);
    			attr_dev(h5, "class", "d-inline");
    			add_location(h5, file$6, 77, 28, 3223);
    			attr_dev(h6, "class", "separator mb-4 svelte-16wuzuy");
    			add_location(h6, file$6, 78, 28, 3357);
    			attr_dev(div4, "class", "card-body text-center c-purple");
    			add_location(div4, file$6, 76, 24, 3149);
    			attr_dev(div5, "class", "card");
    			add_location(div5, file$6, 75, 20, 3105);
    			attr_dev(div6, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div6, file$6, 74, 16, 3045);
    			attr_dev(div7, "class", "row justify-content-center pt-3");
    			add_location(div7, file$6, 73, 12, 2982);
    			attr_dev(div8, "class", "container-fluid");
    			add_location(div8, file$6, 37, 8, 1150);
    			attr_dev(div9, "class", "vertical-center");
    			add_location(div9, file$6, 36, 4, 1111);
    			attr_dev(div10, "class", "");
    			add_location(div10, file$6, 26, 0, 758);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div10, anchor);
    			append_dev(div10, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div10, t0);
    			append_dev(div10, div9);
    			append_dev(div9, div8);
    			if_block.m(div8, null);
    			append_dev(div8, t1);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, h5);
    			append_dev(h5, t2);
    			append_dev(h5, t3);
    			append_dev(h5, t4);
    			append_dev(h5, small);
    			append_dev(small, t5);
    			append_dev(small, t6);
    			append_dev(small, t7);
    			append_dev(small, t8);
    			append_dev(small, t9);
    			append_dev(div4, t10);
    			append_dev(div4, h6);
    			append_dev(div4, t12);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div4, null);
    				}
    			}

    			insert_dev(target, t13, anchor);
    			mount_component(toast, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler*/ ctx[5], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div8, t1);
    				}
    			}

    			if ((!current || dirty & /*$game*/ 1) && t8_value !== (t8_value = /*$game*/ ctx[0].teams.length + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*getOrderedTeams, getCurrentTeam, $settings*/ 2) {
    				each_value = getOrderedTeams();
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (!div10_intro) {
    				add_render_callback(() => {
    					div10_intro = create_in_transition(div10, fly, {});
    					div10_intro.start();
    				});
    			}

    			transition_in(toast.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toast.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div10);
    			if_block.d();
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t13);
    			destroy_component(toast, detaching);
    			mounted = false;
    			dispose();
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
    	let $game;
    	let $settings;
    	validate_store(game, 'game');
    	component_subscribe($$self, game, $$value => $$invalidate(0, $game = $$value));
    	validate_store(settings, 'settings');
    	component_subscribe($$self, settings, $$value => $$invalidate(1, $settings = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('InterimScore', slots, []);

    	function startTime() {
    		window.clearToasts();
    		nextRound();
    	}

    	function nextRound() {
    		setNextFiveWords();
    		currentGameScreen.set(GuessScreen);
    	}

    	function getGameRound() {
    		return Math.floor($game.round / $game.teams.length) + 1;
    	}

    	function getTurn() {
    		return $game.round % $game.teams.length;
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<InterimScore> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => currentGameScreen.set(Settings);
    	const click_handler_1 = () => endGame();
    	const click_handler_2 = () => startTime();

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		game,
    		getCurrentPlayer,
    		setNextFiveWords,
    		settings,
    		getOrderedTeams,
    		endGame,
    		getCurrentTeam,
    		GuessScreen,
    		Settings,
    		Toast,
    		fly,
    		startTime,
    		nextRound,
    		getGameRound,
    		getTurn,
    		$game,
    		$settings
    	});

    	return [
    		$game,
    		$settings,
    		startTime,
    		getGameRound,
    		getTurn,
    		click_handler,
    		click_handler_1,
    		click_handler_2
    	];
    }

    class InterimScore extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "InterimScore",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src\components\Help.svelte generated by Svelte v3.59.2 */
    const file$7 = "src\\components\\Help.svelte";

    // (49:36) {:else}
    function create_else_block_4(ctx) {
    	let h5;
    	let i0;
    	let t0;
    	let i1;
    	let t1;
    	let hr;
    	let t2;
    	let ol;
    	let li0;
    	let t4;
    	let li1;
    	let t6;
    	let li2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			i0 = element("i");
    			t0 = text(" Safari ");
    			i1 = element("i");
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			ol = element("ol");
    			li0 = element("li");
    			li0.textContent = "CLick on the \"sharing\" icon";
    			t4 = space();
    			li1 = element("li");
    			li1.textContent = "Click on \"Put on startscreen\"";
    			t6 = space();
    			li2 = element("li");
    			li2.textContent = "Click on \"Add\"";
    			attr_dev(i0, "class", "fab fa-apple");
    			add_location(i0, file$7, 49, 78, 2244);
    			attr_dev(i1, "class", "fas float-end d-inline fa-chevron-down");
    			add_location(i1, file$7, 49, 114, 2280);
    			add_location(h5, file$7, 49, 36, 2202);
    			add_location(hr, file$7, 50, 36, 2377);
    			add_location(li0, file$7, 52, 40, 2474);
    			add_location(li1, file$7, 53, 40, 2552);
    			add_location(li2, file$7, 54, 40, 2632);
    			attr_dev(ol, "type", "1");
    			add_location(ol, file$7, 51, 36, 2419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, i0);
    			append_dev(h5, t0);
    			append_dev(h5, i1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, ol, anchor);
    			append_dev(ol, li0);
    			append_dev(ol, t4);
    			append_dev(ol, li1);
    			append_dev(ol, t6);
    			append_dev(ol, li2);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_2*/ ctx[7], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(ol);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_4.name,
    		type: "else",
    		source: "(49:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (46:36) {#if !safari}
    function create_if_block_4(ctx) {
    	let h5;
    	let i0;
    	let t0;
    	let i1;
    	let t1;
    	let hr;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			i0 = element("i");
    			t0 = text(" Safari ");
    			i1 = element("i");
    			t1 = space();
    			hr = element("hr");
    			attr_dev(i0, "class", "fab fa-apple");
    			add_location(i0, file$7, 46, 78, 1981);
    			attr_dev(i1, "class", "fas float-end d-inline fa-chevron-right");
    			add_location(i1, file$7, 46, 114, 2017);
    			add_location(h5, file$7, 46, 36, 1939);
    			add_location(hr, file$7, 47, 36, 2115);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, i0);
    			append_dev(h5, t0);
    			append_dev(h5, i1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_1*/ ctx[6], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(46:36) {#if !safari}",
    		ctx
    	});

    	return block;
    }

    // (65:36) {:else}
    function create_else_block_3(ctx) {
    	let h5;
    	let i0;
    	let t0;
    	let i1;
    	let t1;
    	let hr;
    	let t2;
    	let ol;
    	let li0;
    	let t3;
    	let i2;
    	let t4;
    	let t5;
    	let li1;
    	let t7;
    	let li2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			i0 = element("i");
    			t0 = text(" Chrome ");
    			i1 = element("i");
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			ol = element("ol");
    			li0 = element("li");
    			t3 = text("Click on the ");
    			i2 = element("i");
    			t4 = text(" icon");
    			t5 = space();
    			li1 = element("li");
    			li1.textContent = "Click on \"Install app\"";
    			t7 = space();
    			li2 = element("li");
    			li2.textContent = "Click on \"Install\"";
    			attr_dev(i0, "class", "fab fa-android");
    			add_location(i0, file$7, 65, 78, 3347);
    			attr_dev(i1, "class", "fas float-end d-inline fa-chevron-down");
    			add_location(i1, file$7, 65, 116, 3385);
    			add_location(h5, file$7, 65, 36, 3305);
    			add_location(hr, file$7, 66, 36, 3482);
    			attr_dev(i2, "class", "fas fa-ellipsis-v");
    			add_location(i2, file$7, 68, 57, 3596);
    			add_location(li0, file$7, 68, 40, 3579);
    			add_location(li1, file$7, 69, 40, 3681);
    			add_location(li2, file$7, 70, 40, 3754);
    			attr_dev(ol, "type", "1");
    			add_location(ol, file$7, 67, 36, 3524);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, i0);
    			append_dev(h5, t0);
    			append_dev(h5, i1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, ol, anchor);
    			append_dev(ol, li0);
    			append_dev(li0, t3);
    			append_dev(li0, i2);
    			append_dev(li0, t4);
    			append_dev(ol, t5);
    			append_dev(ol, li1);
    			append_dev(ol, t7);
    			append_dev(ol, li2);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_4*/ ctx[9], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(ol);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_3.name,
    		type: "else",
    		source: "(65:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (62:36) {#if !chrome}
    function create_if_block_3(ctx) {
    	let h5;
    	let i0;
    	let t0;
    	let i1;
    	let t1;
    	let hr;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			i0 = element("i");
    			t0 = text(" Chrome ");
    			i1 = element("i");
    			t1 = space();
    			hr = element("hr");
    			attr_dev(i0, "class", "fab fa-android");
    			add_location(i0, file$7, 62, 78, 3082);
    			attr_dev(i1, "class", "fas float-end d-inline fa-chevron-right");
    			add_location(i1, file$7, 62, 116, 3120);
    			add_location(h5, file$7, 62, 36, 3040);
    			add_location(hr, file$7, 63, 36, 3218);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, i0);
    			append_dev(h5, t0);
    			append_dev(h5, i1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_3*/ ctx[8], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(62:36) {#if !chrome}",
    		ctx
    	});

    	return block;
    }

    // (81:36) {:else}
    function create_else_block_2(ctx) {
    	let h5;
    	let i0;
    	let t0;
    	let i1;
    	let t1;
    	let hr;
    	let t2;
    	let ol;
    	let li0;
    	let t3;
    	let i2;
    	let t4;
    	let t5;
    	let li1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			i0 = element("i");
    			t0 = text(" Samsung Internet ");
    			i1 = element("i");
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			ol = element("ol");
    			li0 = element("li");
    			t3 = text("Click on the ");
    			i2 = element("i");
    			t4 = text(" icon");
    			t5 = space();
    			li1 = element("li");
    			li1.textContent = "Click on \"Add to start screen\"";
    			attr_dev(i0, "class", "fab fa-android");
    			add_location(i0, file$7, 81, 96, 4528);
    			attr_dev(i1, "class", "fas float-end d-inline fa-chevron-down");
    			add_location(i1, file$7, 81, 144, 4576);
    			add_location(h5, file$7, 81, 36, 4468);
    			add_location(hr, file$7, 82, 36, 4673);
    			attr_dev(i2, "class", "fas fa-ellipsis-v");
    			add_location(i2, file$7, 84, 57, 4787);
    			add_location(li0, file$7, 84, 40, 4770);
    			add_location(li1, file$7, 85, 40, 4872);
    			attr_dev(ol, "type", "1");
    			add_location(ol, file$7, 83, 36, 4715);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, i0);
    			append_dev(h5, t0);
    			append_dev(h5, i1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, ol, anchor);
    			append_dev(ol, li0);
    			append_dev(li0, t3);
    			append_dev(li0, i2);
    			append_dev(li0, t4);
    			append_dev(ol, t5);
    			append_dev(ol, li1);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_6*/ ctx[11], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(ol);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_2.name,
    		type: "else",
    		source: "(81:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (78:36) {#if !samsungInternet}
    function create_if_block_2(ctx) {
    	let h5;
    	let i0;
    	let t0;
    	let i1;
    	let t1;
    	let hr;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			i0 = element("i");
    			t0 = text(" Samsung Internet ");
    			i1 = element("i");
    			t1 = space();
    			hr = element("hr");
    			attr_dev(i0, "class", "fab fa-android");
    			add_location(i0, file$7, 78, 96, 4235);
    			attr_dev(i1, "class", "fas float-end d-inline fa-chevron-right");
    			add_location(i1, file$7, 78, 144, 4283);
    			add_location(h5, file$7, 78, 36, 4175);
    			add_location(hr, file$7, 79, 36, 4381);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, i0);
    			append_dev(h5, t0);
    			append_dev(h5, i1);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_5*/ ctx[10], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(78:36) {#if !samsungInternet}",
    		ctx
    	});

    	return block;
    }

    // (113:36) {:else}
    function create_else_block_1$1(ctx) {
    	let h5;
    	let t0;
    	let i0;
    	let t1;
    	let hr;
    	let t2;
    	let p;
    	let t3;
    	let i1;
    	let t4;
    	let br0;
    	let t5;
    	let i2;
    	let t6;
    	let br1;
    	let t7;
    	let br2;
    	let t8;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text("1. Create teams ");
    			i0 = element("i");
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			p = element("p");
    			t3 = text("Add a team by filling in the teamname and clicking on the ");
    			i1 = element("i");
    			t4 = text(" button. ");
    			br0 = element("br");
    			t5 = text("\r\n                                        Then add the players by clicking on the team, filling in the player name, and clicking the ");
    			i2 = element("i");
    			t6 = text(" \r\n                                        button. ");
    			br1 = element("br");
    			t7 = space();
    			br2 = element("br");
    			t8 = text("\r\n                                        Note: A team consists of 2 players minimum.");
    			attr_dev(i0, "class", "fas float-end d-inline fa-chevron-down");
    			add_location(i0, file$7, 113, 100, 6388);
    			add_location(h5, file$7, 113, 36, 6324);
    			add_location(hr, file$7, 114, 36, 6485);
    			attr_dev(i1, "class", "fas fa-plus-square");
    			add_location(i1, file$7, 116, 98, 6639);
    			add_location(br0, file$7, 116, 141, 6682);
    			attr_dev(i2, "class", "fas fa-plus-square");
    			add_location(i2, file$7, 117, 131, 6819);
    			add_location(br1, file$7, 118, 48, 6904);
    			add_location(br2, file$7, 118, 53, 6909);
    			attr_dev(p, "class", "");
    			add_location(p, file$7, 115, 36, 6527);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			append_dev(h5, i0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t3);
    			append_dev(p, i1);
    			append_dev(p, t4);
    			append_dev(p, br0);
    			append_dev(p, t5);
    			append_dev(p, i2);
    			append_dev(p, t6);
    			append_dev(p, br1);
    			append_dev(p, t7);
    			append_dev(p, br2);
    			append_dev(p, t8);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_8*/ ctx[13], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(113:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (110:36) {#if !makeTeams}
    function create_if_block_1$1(ctx) {
    	let h5;
    	let t0;
    	let i;
    	let t1;
    	let hr;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text("1. Create teams ");
    			i = element("i");
    			t1 = space();
    			hr = element("hr");
    			attr_dev(i, "class", "fas float-end d-inline fa-chevron-right");
    			add_location(i, file$7, 110, 100, 6139);
    			add_location(h5, file$7, 110, 36, 6075);
    			add_location(hr, file$7, 111, 36, 6237);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			append_dev(h5, i);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_7*/ ctx[12], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(110:36) {#if !makeTeams}",
    		ctx
    	});

    	return block;
    }

    // (130:36) {:else}
    function create_else_block$3(ctx) {
    	let h5;
    	let t0;
    	let i;
    	let t1;
    	let hr;
    	let t2;
    	let p;
    	let t3;
    	let br;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text("2. Start the game ");
    			i = element("i");
    			t1 = space();
    			hr = element("hr");
    			t2 = space();
    			p = element("p");
    			t3 = text("When their are at least 2 teams with 2 people, the game can be started by pressing the button \"Start game\". ");
    			br = element("br");
    			attr_dev(i, "class", "fas float-end d-inline fa-chevron-down");
    			add_location(i, file$7, 130, 102, 7702);
    			add_location(h5, file$7, 130, 36, 7636);
    			add_location(hr, file$7, 131, 36, 7799);
    			add_location(br, file$7, 133, 148, 8003);
    			attr_dev(p, "class", "");
    			add_location(p, file$7, 132, 36, 7841);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			append_dev(h5, i);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t3);
    			append_dev(p, br);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_10*/ ctx[15], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(p);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(130:36) {:else}",
    		ctx
    	});

    	return block;
    }

    // (127:36) {#if !startGame}
    function create_if_block$4(ctx) {
    	let h5;
    	let t0;
    	let i;
    	let t1;
    	let hr;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text("2. Start the game ");
    			i = element("i");
    			t1 = space();
    			hr = element("hr");
    			attr_dev(i, "class", "fas float-end d-inline fa-chevron-right");
    			add_location(i, file$7, 127, 102, 7451);
    			add_location(h5, file$7, 127, 36, 7385);
    			add_location(hr, file$7, 128, 36, 7549);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			append_dev(h5, i);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, hr, anchor);

    			if (!mounted) {
    				dispose = listen_dev(h5, "click", /*click_handler_9*/ ctx[14], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(hr);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(127:36) {#if !startGame}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let div28;
    	let div2;
    	let div1;
    	let div0;
    	let i;
    	let t0;
    	let div4;
    	let div3;
    	let h1;
    	let t2;
    	let div27;
    	let div16;
    	let div15;
    	let div14;
    	let div13;
    	let div6;
    	let div5;
    	let h30;
    	let t4;
    	let p0;
    	let t6;
    	let div8;
    	let div7;
    	let hr0;
    	let t7;
    	let t8;
    	let div10;
    	let div9;
    	let t9;
    	let div12;
    	let div11;
    	let t10;
    	let div26;
    	let div25;
    	let div24;
    	let div23;
    	let div18;
    	let div17;
    	let h31;
    	let t12;
    	let p1;
    	let t14;
    	let div20;
    	let div19;
    	let hr1;
    	let t15;
    	let t16;
    	let div22;
    	let div21;
    	let div28_intro;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (!/*safari*/ ctx[0]) return create_if_block_4;
    		return create_else_block_4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function select_block_type_1(ctx, dirty) {
    		if (!/*chrome*/ ctx[1]) return create_if_block_3;
    		return create_else_block_3;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function select_block_type_2(ctx, dirty) {
    		if (!/*samsungInternet*/ ctx[2]) return create_if_block_2;
    		return create_else_block_2;
    	}

    	let current_block_type_2 = select_block_type_2(ctx);
    	let if_block2 = current_block_type_2(ctx);

    	function select_block_type_3(ctx, dirty) {
    		if (!/*makeTeams*/ ctx[3]) return create_if_block_1$1;
    		return create_else_block_1$1;
    	}

    	let current_block_type_3 = select_block_type_3(ctx);
    	let if_block3 = current_block_type_3(ctx);

    	function select_block_type_4(ctx, dirty) {
    		if (!/*startGame*/ ctx[4]) return create_if_block$4;
    		return create_else_block$3;
    	}

    	let current_block_type_4 = select_block_type_4(ctx);
    	let if_block4 = current_block_type_4(ctx);

    	const block = {
    		c: function create() {
    			div28 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i = element("i");
    			t0 = space();
    			div4 = element("div");
    			div3 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Help";
    			t2 = space();
    			div27 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div6 = element("div");
    			div5 = element("div");
    			h30 = element("h3");
    			h30.textContent = "Install & Update";
    			t4 = space();
    			p0 = element("p");
    			p0.textContent = "This app is installable as a Progressive Web App, such that it is \r\n                                        usable without internet connection, while receiving updates automatically.";
    			t6 = space();
    			div8 = element("div");
    			div7 = element("div");
    			hr0 = element("hr");
    			t7 = space();
    			if_block0.c();
    			t8 = space();
    			div10 = element("div");
    			div9 = element("div");
    			if_block1.c();
    			t9 = space();
    			div12 = element("div");
    			div11 = element("div");
    			if_block2.c();
    			t10 = space();
    			div26 = element("div");
    			div25 = element("div");
    			div24 = element("div");
    			div23 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			h31 = element("h3");
    			h31.textContent = "Play";
    			t12 = space();
    			p1 = element("p");
    			p1.textContent = "Explanation about how to play 43 seconds";
    			t14 = space();
    			div20 = element("div");
    			div19 = element("div");
    			hr1 = element("hr");
    			t15 = space();
    			if_block3.c();
    			t16 = space();
    			div22 = element("div");
    			div21 = element("div");
    			if_block4.c();
    			attr_dev(i, "class", "c-white fas fa-times");
    			add_location(i, file$7, 18, 20, 611);
    			attr_dev(div0, "class", "float-end");
    			add_location(div0, file$7, 17, 16, 519);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$7, 16, 12, 481);
    			attr_dev(div2, "class", "row mb-3");
    			add_location(div2, file$7, 15, 8, 445);
    			attr_dev(h1, "class", "c-white");
    			add_location(h1, file$7, 24, 16, 798);
    			attr_dev(div3, "class", "col-12 text-center");
    			add_location(div3, file$7, 23, 12, 748);
    			attr_dev(div4, "class", "row");
    			add_location(div4, file$7, 22, 8, 717);
    			attr_dev(h30, "class", "text-center");
    			add_location(h30, file$7, 36, 36, 1275);
    			attr_dev(p0, "class", "mb-0");
    			add_location(p0, file$7, 37, 36, 1358);
    			attr_dev(div5, "class", "col-12");
    			add_location(div5, file$7, 35, 32, 1217);
    			attr_dev(div6, "class", "row mb-2 justify-content-center");
    			add_location(div6, file$7, 34, 28, 1138);
    			add_location(hr0, file$7, 44, 36, 1846);
    			attr_dev(div7, "class", "col-12 text-left");
    			add_location(div7, file$7, 43, 32, 1778);
    			attr_dev(div8, "class", "row justify-content-center");
    			add_location(div8, file$7, 42, 28, 1704);
    			attr_dev(div9, "class", "col-12 text-left");
    			add_location(div9, file$7, 60, 32, 2921);
    			attr_dev(div10, "class", "row justify-content-center");
    			add_location(div10, file$7, 59, 28, 2847);
    			attr_dev(div11, "class", "col-12 text-left");
    			add_location(div11, file$7, 76, 32, 4047);
    			attr_dev(div12, "class", "row justify-content-center");
    			add_location(div12, file$7, 75, 28, 3973);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$7, 33, 24, 1085);
    			attr_dev(div14, "class", "card mb-3");
    			add_location(div14, file$7, 32, 20, 1036);
    			attr_dev(div15, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div15, file$7, 31, 16, 976);
    			attr_dev(div16, "class", "row justify-content-center");
    			add_location(div16, file$7, 30, 12, 918);
    			attr_dev(h31, "class", "text-center");
    			add_location(h31, file$7, 101, 36, 5562);
    			attr_dev(p1, "class", "mb-0");
    			add_location(p1, file$7, 102, 36, 5633);
    			attr_dev(div17, "class", "col-12");
    			add_location(div17, file$7, 100, 32, 5504);
    			attr_dev(div18, "class", "row mb-2 justify-content-center");
    			add_location(div18, file$7, 99, 28, 5425);
    			add_location(hr1, file$7, 108, 36, 5979);
    			attr_dev(div19, "class", "col-12 text-left");
    			add_location(div19, file$7, 107, 32, 5911);
    			attr_dev(div20, "class", "row justify-content-center");
    			add_location(div20, file$7, 106, 28, 5837);
    			attr_dev(div21, "class", "col-12 text-left");
    			add_location(div21, file$7, 125, 32, 7263);
    			attr_dev(div22, "class", "row justify-content-center");
    			add_location(div22, file$7, 124, 28, 7189);
    			attr_dev(div23, "class", "card-body");
    			add_location(div23, file$7, 98, 24, 5372);
    			attr_dev(div24, "class", "card mb-3");
    			add_location(div24, file$7, 97, 20, 5323);
    			attr_dev(div25, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div25, file$7, 96, 16, 5263);
    			attr_dev(div26, "class", "row justify-content-center");
    			add_location(div26, file$7, 95, 12, 5205);
    			attr_dev(div27, "class", "container");
    			add_location(div27, file$7, 28, 8, 879);
    			attr_dev(div28, "class", "container-fluid pt-2 vh-100");
    			add_location(div28, file$7, 14, 4, 387);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div28, anchor);
    			append_dev(div28, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i);
    			append_dev(div28, t0);
    			append_dev(div28, div4);
    			append_dev(div4, div3);
    			append_dev(div3, h1);
    			append_dev(div28, t2);
    			append_dev(div28, div27);
    			append_dev(div27, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div6);
    			append_dev(div6, div5);
    			append_dev(div5, h30);
    			append_dev(div5, t4);
    			append_dev(div5, p0);
    			append_dev(div13, t6);
    			append_dev(div13, div8);
    			append_dev(div8, div7);
    			append_dev(div7, hr0);
    			append_dev(div7, t7);
    			if_block0.m(div7, null);
    			append_dev(div13, t8);
    			append_dev(div13, div10);
    			append_dev(div10, div9);
    			if_block1.m(div9, null);
    			append_dev(div13, t9);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			if_block2.m(div11, null);
    			append_dev(div27, t10);
    			append_dev(div27, div26);
    			append_dev(div26, div25);
    			append_dev(div25, div24);
    			append_dev(div24, div23);
    			append_dev(div23, div18);
    			append_dev(div18, div17);
    			append_dev(div17, h31);
    			append_dev(div17, t12);
    			append_dev(div17, p1);
    			append_dev(div23, t14);
    			append_dev(div23, div20);
    			append_dev(div20, div19);
    			append_dev(div19, hr1);
    			append_dev(div19, t15);
    			if_block3.m(div19, null);
    			append_dev(div23, t16);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			if_block4.m(div21, null);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*click_handler*/ ctx[5], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div7, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(div9, null);
    				}
    			}

    			if (current_block_type_2 === (current_block_type_2 = select_block_type_2(ctx)) && if_block2) {
    				if_block2.p(ctx, dirty);
    			} else {
    				if_block2.d(1);
    				if_block2 = current_block_type_2(ctx);

    				if (if_block2) {
    					if_block2.c();
    					if_block2.m(div11, null);
    				}
    			}

    			if (current_block_type_3 === (current_block_type_3 = select_block_type_3(ctx)) && if_block3) {
    				if_block3.p(ctx, dirty);
    			} else {
    				if_block3.d(1);
    				if_block3 = current_block_type_3(ctx);

    				if (if_block3) {
    					if_block3.c();
    					if_block3.m(div19, null);
    				}
    			}

    			if (current_block_type_4 === (current_block_type_4 = select_block_type_4(ctx)) && if_block4) {
    				if_block4.p(ctx, dirty);
    			} else {
    				if_block4.d(1);
    				if_block4 = current_block_type_4(ctx);

    				if (if_block4) {
    					if_block4.c();
    					if_block4.m(div21, null);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (!div28_intro) {
    				add_render_callback(() => {
    					div28_intro = create_in_transition(div28, fly, {});
    					div28_intro.start();
    				});
    			}
    		},
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div28);
    			if_block0.d();
    			if_block1.d();
    			if_block2.d();
    			if_block3.d();
    			if_block4.d();
    			mounted = false;
    			dispose();
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

    function instance$7($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Help', slots, []);
    	let safari = false;
    	let chrome = false;
    	let samsungInternet = false;
    	let makeTeams = false;
    	let startGame = false;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Help> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => currentGameScreen.set(Home);

    	const click_handler_1 = () => {
    		$$invalidate(0, safari = !safari);
    	};

    	const click_handler_2 = () => {
    		$$invalidate(0, safari = !safari);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(1, chrome = !chrome);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(1, chrome = !chrome);
    	};

    	const click_handler_5 = () => {
    		$$invalidate(2, samsungInternet = !samsungInternet);
    	};

    	const click_handler_6 = () => {
    		$$invalidate(2, samsungInternet = !samsungInternet);
    	};

    	const click_handler_7 = () => {
    		$$invalidate(3, makeTeams = !makeTeams);
    	};

    	const click_handler_8 = () => {
    		$$invalidate(3, makeTeams = !makeTeams);
    	};

    	const click_handler_9 = () => {
    		$$invalidate(4, startGame = !startGame);
    	};

    	const click_handler_10 = () => {
    		$$invalidate(4, startGame = !startGame);
    	};

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		game,
    		settings,
    		saveSettings,
    		endGame,
    		prevGameScreen,
    		goToHome,
    		Home,
    		fly,
    		safari,
    		chrome,
    		samsungInternet,
    		makeTeams,
    		startGame
    	});

    	$$self.$inject_state = $$props => {
    		if ('safari' in $$props) $$invalidate(0, safari = $$props.safari);
    		if ('chrome' in $$props) $$invalidate(1, chrome = $$props.chrome);
    		if ('samsungInternet' in $$props) $$invalidate(2, samsungInternet = $$props.samsungInternet);
    		if ('makeTeams' in $$props) $$invalidate(3, makeTeams = $$props.makeTeams);
    		if ('startGame' in $$props) $$invalidate(4, startGame = $$props.startGame);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		safari,
    		chrome,
    		samsungInternet,
    		makeTeams,
    		startGame,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		click_handler_10
    	];
    }

    class Help extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Help",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    const interActief = [
        "#Bibz",
        "A Night In Paris",
        "A-Eskwadraat",
        "Abacus",
        "Abscint",
        "Advisory board",
        "Alembic",
        "Alpequalpeqi",
        "Andrea Rijkeboer",
        "Animal on spit drink",
        "Applied Mathematics",
        "Arago",
        "Arie Duijvestijn",
        "Ascend",
        "Assembly",
        "Astatine",
        "AstronomIA",
        "Atlantis",
        "Audit Committee",
        "BIT",
        "BIT's Lit",
        "Back on Track",
        "Bart Leenheer",
        "Bartenders",
        "Batavierenrace",
        "Belastingdienst",
        "BetterBe",
        "Bits Please!",
        "Blast From The Past",
        "Board Workload Taskforce",
        "Bob Ross",
        "Bram van Dartel",
        "Bronto DB",
        "C",
        "C#",
        "C++",
        "CSS",
        "Cantus",
        "Canvas",
        "Capgemini",
        "Casino Night",
        "CelerIT",
        "ChaChi",
        "Chairman",
        "Chris Wong",
        "Christiaan Huygens",
        "CoLeX",
        "Communiqué",
        "Computer Architecture for Embedded Systems (CAES)",
        "Computer Systems",
        "ConcepT",
        "Constitution Drink",
        "Cooking Club",
        "Cover",
        "CreativIT",
        "Culture Committee",
        "Cyber Physical Systems",
        "Cyber Security",
        "DESDA",
        "Daddy Kool",
        "Daedalus",
        "Daniël Jonker",
        "Daniël van Andel",
        "Das Mooi!",
        "Data & Information",
        "Data Management & Biometrics (DMB)",
        "Data Science & Artificial Intelligence: Seeing through the hype",
        "Data Science & Technology",
        "De Leidsche Flesch",
        "DeCo",
        "Denarius",
        "Design and Analysis of Communication Systems (DACS)",
        "Di Stephano",
        "DiesCie",
        "Dilan van Oosten",
        "Dimensie",
        "Dipso",
        "Discrete Stuctures & Efficient Algorithms",
        "Disseminate",
        "Doina Bucur",
        "Don't Panic",
        "Duru Koçak",
        "ECA",
        "EEMCS Trip",
        "ENIAC",
        "EducaCie",
        "Educational Affairs",
        "Eelco Eerenberg",
        "Electrical Engineering",
        "Eleven Beers Tour",
        "Escape the City",
        "Evolve",
        "Ex on the beach",
        "Exact Online",
        "External Affairs",
        "Extraterrestrial Encounter",
        "FMF",
        "Faiza Bukhsh",
        "Faizan Ahmed",
        "Fantasia",
        "Fiasco",
        "Formal Methods and Tools (FMT)",
        "Fortes Solutions",
        "Frank van Mourik",
        "FreshCo",
        "Freshmen Bowling",
        "Fuente",
        "Full House",
        "GEWIS",
        "GMA",
        "GMM",
        "GameCie",
        "Games of Gallia",
        "Gender in the blender drink",
        "Gilian Schrijver",
        "HERO's",
        "Hal B",
        "Han Joosten",
        "Harambee",
        "Haskell",
        "Hein Huijskes",
        "Hephaestus",
        "Het Genootschap BIT",
        "Horus",
        "Hot Ones",
        "How to Borrel",
        "Human Media Interaction (HMI)",
        "Hyper",
        "I/O Vivat",
        "IA room",
        "IAPC",
        "IBCC",
        "Ideefiks",
        "Illuminate",
        "Insomnia",
        "Inspire",
        "Intelligent Interaction Design",
        "Inter-Actief",
        "InterRailing",
        "Internal Affairs",
        "Internet Science & Technology",
        "Iris van Duiven",
        "Isaac Newton",
        "Java",
        "JavaScript",
        "Jelle Maas",
        "Jelte Zeilstra",
        "Job Ulfman",
        "Jochem Bleeker",
        "Johan Noltes",
        "Karel de Jonge",
        "Kevin Alberts",
        "Kick-IT",
        "Komma",
        "Lahmacun Lecture",
        "Lars van Arkel",
        "Lorem Ipsum",
        "Lunch lectures",
        "MBasement",
        "Maaike Butink",
        "Maarten Meijer",
        "MafIA",
        "Mahboobeh Zangiabady",
        "Mariska Frelier",
        "Mathijs Vogelezang",
        "Maurice van Keulen",
        "MedIA",
        "Met Mate(n)",
        "Michael Janssen",
        "MinIAture",
        "Miranda",
        "MobiliIT",
        "MonkIA",
        "Movie park Germany",
        "Nacir Bouali",
        "Networking Systems",
        "Nexus",
        "Niels Rotmensen",
        "NostalgIA",
        "OS",
        "OVSoftware",
        "Oktoberfest",
        "Oliver Davies",
        "Open Up",
        "Pandora",
        "Paradoks",
        "PartyCo",
        "Pearls of Computer Science",
        "Pervasive Systems (PS)",
        "Pieter-Tjerk de Boer",
        "Primavera",
        "Programming Paradigms",
        "Project Diamond",
        "Proto",
        "Python",
        "Quirijn Hoenink",
        "RIAlly",
        "Race Cafe Australia",
        "RedShell",
        "Rianne de Jong",
        "Rom Langerak",
        "Roomboter",
        "Rosan Maas",
        "SAGA",
        "SNiC",
        "SQL",
        "STORM",
        "SU",
        "Sander Timmer",
        "Sanne Spuls",
        "Scintilla",
        "Secretary",
        "Services and Cybersecutiry (SCS)",
        "Sirius",
        "Sjoerd van der Spoel",
        "Slagwaardig",
        "Smart Spaces",
        "SocCie",
        "Software Systems",
        "Software Technology",
        "Spijkertjes",
        "StAf",
        "Step into the shadows",
        "Sticky",
        "Stress",
        "Study Evening",
        "Study Tour",
        "Study tour",
        "Sudo",
        "Summer Sounds",
        "Sweet 16 drink",
        "SymCie",
        "Symposium",
        "SysCom",
        "TAPC",
        "TaCoS",
        "Technical Computer Science",
        "Tegel",
        "Thalia",
        "Tom Grooters",
        "Tom van Dijk",
        "Toverland",
        "Treasurer",
        "Tristan van Beurden",
        "Tu the moon AD",
        "Turings Tower",
        "Twan Weerdenburg",
        "UToberfest",
        "Vadim Zaytsev",
        "Vice-Chair",
        "Voortman Steel Group",
        "WISO",
        "WWW",
        "Wallace Ugulino",
        "Wander Stribos",
        "Web Science",
        "Wesley Joosten",
        "Wie Geet Lös",
        "Wild Wild West",
        "Willem Schooltink",
        "Wireshark",
        "Wout Velthuis",
        "Wouter Suidgeest",
        "XmasCie",
        "Yahtzee",
        "Yolo",
        "Yorinf",
        "Zephyrus",
        "ZombIA",
        "Zoom Out",
        "aXi",
        "booking.com",
        "chmod",
        "echo",
        "grep",
        "kill -9",
        "mkdir",
        "nano",
        "netstat",
        "sudo",
        "systemctl",
        "touch",
        "via",
        "wget",
    ]; // end interActief

    /* src\components\ChooseListScreen.svelte generated by Svelte v3.59.2 */
    const file$8 = "src\\components\\ChooseListScreen.svelte";

    function create_fragment$8(ctx) {
    	let div17;
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let i0;
    	let t0;
    	let div16;
    	let div15;
    	let div5;
    	let div4;
    	let h1;
    	let t2;
    	let div9;
    	let div8;
    	let div7;
    	let div6;
    	let h2;
    	let t4;
    	let div14;
    	let div13;
    	let div12;
    	let div11;
    	let div10;
    	let input;
    	let t5;
    	let label;
    	let i1;
    	let t6;
    	let i2;
    	let t8;
    	let small;
    	let t12;
    	let hr;
    	let t13;
    	let p;
    	let t14;
    	let i3;
    	let t16;
    	let div17_intro;
    	let t17;
    	let toast;
    	let current;
    	let mounted;
    	let dispose;
    	toast = new Toast({ $$inline: true });

    	const block = {
    		c: function create() {
    			div17 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div16 = element("div");
    			div15 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Choose Categories";
    			t2 = space();
    			div9 = element("div");
    			div8 = element("div");
    			div7 = element("div");
    			div6 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Start Game";
    			t4 = space();
    			div14 = element("div");
    			div13 = element("div");
    			div12 = element("div");
    			div11 = element("div");
    			div10 = element("div");
    			input = element("input");
    			t5 = space();
    			label = element("label");
    			i1 = element("i");
    			t6 = text(" Inter-");
    			i2 = element("i");
    			i2.textContent = "Actief";
    			t8 = space();
    			small = element("small");
    			small.textContent = `(${interActief.length})`;
    			t12 = space();
    			hr = element("hr");
    			t13 = space();
    			p = element("p");
    			t14 = text("A mix of all things, events, and people that make up Inter-");
    			i3 = element("i");
    			i3.textContent = "Actief";
    			t16 = text("!");
    			t17 = space();
    			create_component(toast.$$.fragment);
    			attr_dev(i0, "class", "c-white fas fa-cog");
    			add_location(i0, file$8, 33, 20, 1165);
    			attr_dev(div0, "class", "float-end");
    			add_location(div0, file$8, 32, 16, 1069);
    			attr_dev(div1, "class", "col-12");
    			add_location(div1, file$8, 31, 12, 1031);
    			attr_dev(div2, "class", "row mb-3");
    			add_location(div2, file$8, 30, 8, 995);
    			attr_dev(div3, "class", "container-fluid pt-2");
    			add_location(div3, file$8, 29, 4, 951);
    			attr_dev(h1, "class", "c-white mb-0");
    			add_location(h1, file$8, 42, 20, 1499);
    			attr_dev(div4, "class", "col-12 col-md-8 col-lg-6 mb-5 text-center");
    			add_location(div4, file$8, 41, 16, 1422);
    			attr_dev(div5, "class", "row justify-content-center pt-3");
    			add_location(div5, file$8, 40, 12, 1359);
    			attr_dev(h2, "class", "c-white");
    			add_location(h2, file$8, 50, 28, 1887);
    			attr_dev(div6, "class", "card-body text-center");
    			add_location(div6, file$8, 49, 24, 1822);
    			attr_dev(div7, "class", "card bg-blue");
    			add_location(div7, file$8, 48, 20, 1739);
    			attr_dev(div8, "class", "col-12 col-md-8 col-lg-6 mb-3");
    			add_location(div8, file$8, 47, 16, 1674);
    			attr_dev(div9, "class", "row justify-content-center pt-3 mb-3");
    			add_location(div9, file$8, 46, 12, 1606);
    			attr_dev(input, "class", "form-check-input");
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "id", "check1");
    			add_location(input, file$8, 61, 32, 2341);
    			attr_dev(i1, "class", "fas fa-book");
    			add_location(i1, file$8, 63, 36, 2551);
    			add_location(i2, file$8, 63, 70, 2585);
    			attr_dev(small, "class", "float-right");
    			add_location(small, file$8, 63, 84, 2599);
    			attr_dev(label, "class", "form-check-label");
    			attr_dev(label, "for", "check1");
    			add_location(label, file$8, 62, 32, 2468);
    			attr_dev(div10, "class", "form-check svelte-7xpape");
    			add_location(div10, file$8, 60, 28, 2283);
    			attr_dev(hr, "class", "mt-0");
    			add_location(hr, file$8, 67, 28, 3057);
    			add_location(i3, file$8, 68, 103, 3179);
    			attr_dev(p, "class", "my-0");
    			add_location(p, file$8, 68, 28, 3104);
    			attr_dev(div11, "class", "card-body c-purple text-center");
    			add_location(div11, file$8, 59, 24, 2209);
    			attr_dev(div12, "class", "card");
    			add_location(div12, file$8, 58, 20, 2165);
    			attr_dev(div13, "class", "col-12 col-sm-8 col-lg-5 mb-3");
    			add_location(div13, file$8, 57, 16, 2100);
    			attr_dev(div14, "class", "row justify-content-center");
    			add_location(div14, file$8, 56, 12, 2042);
    			attr_dev(div15, "class", "container-fluid");
    			add_location(div15, file$8, 39, 8, 1316);
    			attr_dev(div16, "class", "vertical-center");
    			add_location(div16, file$8, 38, 4, 1277);
    			attr_dev(div17, "class", "");
    			add_location(div17, file$8, 28, 0, 924);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div17, anchor);
    			append_dev(div17, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, i0);
    			append_dev(div17, t0);
    			append_dev(div17, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div5);
    			append_dev(div5, div4);
    			append_dev(div4, h1);
    			append_dev(div15, t2);
    			append_dev(div15, div9);
    			append_dev(div9, div8);
    			append_dev(div8, div7);
    			append_dev(div7, div6);
    			append_dev(div6, h2);
    			append_dev(div15, t4);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div12);
    			append_dev(div12, div11);
    			append_dev(div11, div10);
    			append_dev(div10, input);
    			input.checked = /*interActiefSelect*/ ctx[0];
    			append_dev(div10, t5);
    			append_dev(div10, label);
    			append_dev(label, i1);
    			append_dev(label, t6);
    			append_dev(label, i2);
    			append_dev(label, t8);
    			append_dev(label, small);
    			append_dev(div11, t12);
    			append_dev(div11, hr);
    			append_dev(div11, t13);
    			append_dev(div11, p);
    			append_dev(p, t14);
    			append_dev(p, i3);
    			append_dev(p, t16);
    			insert_dev(target, t17, anchor);
    			mount_component(toast, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[2], false, false, false, false),
    					listen_dev(div7, "click", /*click_handler_1*/ ctx[3], false, false, false, false),
    					listen_dev(input, "change", /*input_change_handler*/ ctx[4])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*interActiefSelect*/ 1) {
    				input.checked = /*interActiefSelect*/ ctx[0];
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			if (!div17_intro) {
    				add_render_callback(() => {
    					div17_intro = create_in_transition(div17, fly, {});
    					div17_intro.start();
    				});
    			}

    			transition_in(toast.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toast.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div17);
    			if (detaching) detach_dev(t17);
    			destroy_component(toast, detaching);
    			mounted = false;
    			run_all(dispose);
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
    	let $game;
    	let $localStorage;
    	validate_store(game, 'game');
    	component_subscribe($$self, game, $$value => $$invalidate(5, $game = $$value));
    	validate_store(localStorage, 'localStorage');
    	component_subscribe($$self, localStorage, $$value => $$invalidate(6, $localStorage = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('ChooseListScreen', slots, []);
    	let interActiefSelect = true;

    	function startGame() {
    		let wordsDatabase = [];

    		if (interActiefSelect) {
    			wordsDatabase = wordsDatabase.concat(interActief);
    		}

    		if (wordsDatabase.length > 1) {
    			set_store_value(game, $game.words = wordsDatabase, $game);
    			$localStorage.setItem('game', JSON.stringify($game));
    			prevGameScreen.set(InterimScore);
    			currentGameScreen.set(InterimScore);
    		} else {
    			window.pushToast("Select a minimum of 1 category");
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<ChooseListScreen> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => currentGameScreen.set(Settings);
    	const click_handler_1 = () => startGame();

    	function input_change_handler() {
    		interActiefSelect = this.checked;
    		$$invalidate(0, interActiefSelect);
    	}

    	$$self.$capture_state = () => ({
    		currentGameScreen,
    		game,
    		localStorage,
    		prevGameScreen,
    		InterimScore,
    		Settings,
    		fly,
    		Toast,
    		interActief,
    		interActiefSelect,
    		startGame,
    		$game,
    		$localStorage
    	});

    	$$self.$inject_state = $$props => {
    		if ('interActiefSelect' in $$props) $$invalidate(0, interActiefSelect = $$props.interActiefSelect);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		interActiefSelect,
    		startGame,
    		click_handler,
    		click_handler_1,
    		input_change_handler
    	];
    }

    class ChooseListScreen extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ChooseListScreen",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const teams = writable([]);


    function saveTeamsToLocalStorage() {
        get_store_value(localStorage).setItem('teams', JSON.stringify(get_store_value(teams)));
    }

    /* src\components\HomeTeamsCollapsible.svelte generated by Svelte v3.59.2 */
    const file$9 = "src\\components\\HomeTeamsCollapsible.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (43:0) {#if $teams[index].players}
    function create_if_block$5(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let t;

    	function select_block_type(ctx, dirty) {
    		if (/*playersVisible*/ ctx[1]) return create_if_block_3$1;
    		return create_else_block$4;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);
    	let if_block1 = /*playersVisible*/ ctx[1] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			if_block0.c();
    			t = space();
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "card-body");
    			add_location(div0, file$9, 46, 12, 1296);
    			attr_dev(div1, "class", "card");
    			add_location(div1, file$9, 45, 8, 1264);
    			attr_dev(div2, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div2, file$9, 44, 4, 1216);
    			attr_dev(div3, "class", "row justify-content-center");
    			add_location(div3, file$9, 43, 0, 1170);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			if_block0.m(div0, null);
    			append_dev(div0, t);
    			if (if_block1) if_block1.m(div0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, t);
    				}
    			}

    			if (/*playersVisible*/ ctx[1]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1$2(ctx);
    					if_block1.c();
    					if_block1.m(div0, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			if_block0.d();
    			if (if_block1) if_block1.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(43:0) {#if $teams[index].players}",
    		ctx
    	});

    	return block;
    }

    // (51:16) {:else}
    function create_else_block$4(ctx) {
    	let h30;
    	let t0_value = /*$teams*/ ctx[3][/*index*/ ctx[0]].name + "";
    	let t0;
    	let t1;
    	let h31;
    	let t2_value = (/*$teams*/ ctx[3][/*index*/ ctx[0]].players.length || 0) + "";
    	let t2;
    	let t3;
    	let i;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			h31 = element("h3");
    			t2 = text(t2_value);
    			t3 = text(" players ");
    			i = element("i");
    			attr_dev(h30, "class", "d-inline mb-0 float-start");
    			add_location(h30, file$9, 51, 16, 1806);
    			attr_dev(i, "class", "fas fa-chevron-right");
    			add_location(i, file$9, 52, 178, 2049);
    			attr_dev(h31, "class", "d-inline mb-0 float-end");
    			add_location(h31, file$9, 52, 16, 1887);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			append_dev(h30, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, h31, anchor);
    			append_dev(h31, t2);
    			append_dev(h31, t3);
    			append_dev(h31, i);

    			if (!mounted) {
    				dispose = listen_dev(h31, "click", /*click_handler_2*/ ctx[9], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$teams, index*/ 9 && t0_value !== (t0_value = /*$teams*/ ctx[3][/*index*/ ctx[0]].name + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$teams, index*/ 9 && t2_value !== (t2_value = (/*$teams*/ ctx[3][/*index*/ ctx[0]].players.length || 0) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(h31);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(51:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:16) {#if playersVisible}
    function create_if_block_3$1(ctx) {
    	let h30;
    	let div;
    	let i0;
    	let t0;
    	let t1_value = /*$teams*/ ctx[3][/*index*/ ctx[0]].name + "";
    	let t1;
    	let t2;
    	let h31;
    	let t3_value = (/*$teams*/ ctx[3][/*index*/ ctx[0]].players.length || 0) + "";
    	let t3;
    	let t4;
    	let i1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			h30 = element("h3");
    			div = element("div");
    			i0 = element("i");
    			t0 = space();
    			t1 = text(t1_value);
    			t2 = space();
    			h31 = element("h3");
    			t3 = text(t3_value);
    			t4 = text(" players ");
    			i1 = element("i");
    			attr_dev(i0, "class", "fas fa-trash-alt c-red");
    			add_location(i0, file$9, 48, 115, 1474);
    			attr_dev(div, "class", "d-inline");
    			add_location(div, file$9, 48, 54, 1413);
    			attr_dev(h30, "class", "d-inline mb-0 float-start");
    			add_location(h30, file$9, 48, 16, 1375);
    			attr_dev(i1, "class", "fas fa-chevron-down");
    			add_location(i1, file$9, 49, 177, 1723);
    			attr_dev(h31, "class", "d-inline mb-0 float-end");
    			add_location(h31, file$9, 49, 16, 1562);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h30, anchor);
    			append_dev(h30, div);
    			append_dev(div, i0);
    			append_dev(h30, t0);
    			append_dev(h30, t1);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, h31, anchor);
    			append_dev(h31, t3);
    			append_dev(h31, t4);
    			append_dev(h31, i1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div, "click", /*click_handler*/ ctx[7], false, false, false, false),
    					listen_dev(h31, "click", /*click_handler_1*/ ctx[8], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$teams, index*/ 9 && t1_value !== (t1_value = /*$teams*/ ctx[3][/*index*/ ctx[0]].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$teams, index*/ 9 && t3_value !== (t3_value = (/*$teams*/ ctx[3][/*index*/ ctx[0]].players.length || 0) + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h30);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(h31);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(48:16) {#if playersVisible}",
    		ctx
    	});

    	return block;
    }

    // (56:16) {#if playersVisible}
    function create_if_block_1$2(ctx) {
    	let div0;
    	let t0;
    	let hr0;
    	let t1;
    	let div3;
    	let div1;
    	let input;
    	let t2;
    	let div2;
    	let button;
    	let i;
    	let t3;
    	let hr1;
    	let t4;
    	let each_1_anchor;
    	let mounted;
    	let dispose;
    	let each_value = /*$teams*/ ctx[3][/*index*/ ctx[0]].players;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			hr0 = element("hr");
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			input = element("input");
    			t2 = space();
    			div2 = element("div");
    			button = element("button");
    			i = element("i");
    			t3 = space();
    			hr1 = element("hr");
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(div0, "class", "clearfix");
    			add_location(div0, file$9, 56, 16, 2171);
    			add_location(hr0, file$9, 57, 16, 2217);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Player Name");
    			add_location(input, file$9, 60, 24, 2338);
    			attr_dev(div1, "class", "col-8 col-md-10");
    			add_location(div1, file$9, 59, 20, 2283);
    			attr_dev(i, "class", "fas fa-plus-square c-white");
    			add_location(i, file$9, 64, 64, 2640);
    			attr_dev(button, "class", "btn bg-blue w-100");
    			add_location(button, file$9, 63, 24, 2541);
    			attr_dev(div2, "class", "col-4 col-md-2");
    			add_location(div2, file$9, 62, 20, 2487);
    			attr_dev(div3, "class", "row mb-3");
    			add_location(div3, file$9, 58, 16, 2239);
    			add_location(hr1, file$9, 67, 16, 2761);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, hr0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div1);
    			append_dev(div1, input);
    			set_input_value(input, /*newTeamMemberName*/ ctx[2]);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, button);
    			append_dev(button, i);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, hr1, anchor);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[10]),
    					listen_dev(button, "click", /*click_handler_3*/ ctx[11], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newTeamMemberName*/ 4 && input.value !== /*newTeamMemberName*/ ctx[2]) {
    				set_input_value(input, /*newTeamMemberName*/ ctx[2]);
    			}

    			if (dirty & /*$teams, index, removePlayer*/ 41) {
    				each_value = /*$teams*/ ctx[3][/*index*/ ctx[0]].players;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
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
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(hr0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(hr1);
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(56:16) {#if playersVisible}",
    		ctx
    	});

    	return block;
    }

    // (71:16) {#if j != $teams[index].players.length-1}
    function create_if_block_2$1(ctx) {
    	let hr;

    	const block = {
    		c: function create() {
    			hr = element("hr");
    			add_location(hr, file$9, 71, 16, 3086);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, hr, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(hr);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(71:16) {#if j != $teams[index].players.length-1}",
    		ctx
    	});

    	return block;
    }

    // (69:16) {#each $teams[index].players as player, j}
    function create_each_block$4(ctx) {
    	let h5;
    	let t0_value = /*player*/ ctx[14].name + "";
    	let t0;
    	let t1;
    	let div;
    	let i;
    	let t2;
    	let if_block_anchor;
    	let mounted;
    	let dispose;

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[12](/*j*/ ctx[16]);
    	}

    	let if_block = /*j*/ ctx[16] != /*$teams*/ ctx[3][/*index*/ ctx[0]].players.length - 1 && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t0 = text(t0_value);
    			t1 = space();
    			div = element("div");
    			i = element("i");
    			t2 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(i, "class", "fas fa-trash-alt float-end c-red");
    			add_location(i, file$9, 69, 123, 2950);
    			attr_dev(div, "class", "d-inline float-end");
    			add_location(div, file$9, 69, 47, 2874);
    			attr_dev(h5, "class", "mb-0");
    			add_location(h5, file$9, 69, 16, 2843);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t0);
    			append_dev(h5, t1);
    			append_dev(h5, div);
    			append_dev(div, i);
    			insert_dev(target, t2, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler_4, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*$teams, index*/ 9 && t0_value !== (t0_value = /*player*/ ctx[14].name + "")) set_data_dev(t0, t0_value);

    			if (/*j*/ ctx[16] != /*$teams*/ ctx[3][/*index*/ ctx[0]].players.length - 1) {
    				if (if_block) ; else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    			if (detaching) detach_dev(t2);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(69:16) {#each $teams[index].players as player, j}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let if_block_anchor;
    	let if_block = /*$teams*/ ctx[3][/*index*/ ctx[0]].players && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$teams*/ ctx[3][/*index*/ ctx[0]].players) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $teams;
    	validate_store(teams, 'teams');
    	component_subscribe($$self, teams, $$value => $$invalidate(3, $teams = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('HomeTeamsCollapsible', slots, []);
    	let { index } = $$props;
    	let playersVisible = false;
    	let newTeamMemberName = "";

    	class Player {
    		constructor(name) {
    			this.name = name;
    		}
    	}

    	function addPlayer(teamIndex) {
    		if (newTeamMemberName.length < 1) {
    			window.pushToast("Fill in a player name");
    			return;
    		}

    		let player = new Player(newTeamMemberName);
    		$teams[teamIndex].players.push(player);

    		//Reactivity
    		teams.set($teams);

    		$$invalidate(2, newTeamMemberName = "");
    		saveTeamsToLocalStorage();
    	}

    	function removePlayer(teamIndex, playerIndex) {
    		$teams[teamIndex].players.splice(playerIndex, 1);

    		//Reactivity
    		teams.set($teams);

    		saveTeamsToLocalStorage();
    	}

    	function removeTeam(teamIndex) {
    		$teams.splice(teamIndex, 1);

    		//Reactivity
    		teams.set($teams);

    		saveTeamsToLocalStorage();
    	}

    	$$self.$$.on_mount.push(function () {
    		if (index === undefined && !('index' in $$props || $$self.$$.bound[$$self.$$.props['index']])) {
    			console.warn("<HomeTeamsCollapsible> was created without expected prop 'index'");
    		}
    	});

    	const writable_props = ['index'];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<HomeTeamsCollapsible> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		removeTeam(index);
    	};

    	const click_handler_1 = () => {
    		$$invalidate(1, playersVisible = !playersVisible);
    		saveTeamsToLocalStorage();
    	};

    	const click_handler_2 = () => {
    		$$invalidate(1, playersVisible = !playersVisible);
    		saveTeamsToLocalStorage();
    	};

    	function input_input_handler() {
    		newTeamMemberName = this.value;
    		$$invalidate(2, newTeamMemberName);
    	}

    	const click_handler_3 = () => addPlayer(index);

    	const click_handler_4 = j => {
    		removePlayer(index, j);
    	};

    	$$self.$$set = $$props => {
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    	};

    	$$self.$capture_state = () => ({
    		teams,
    		saveTeamsToLocalStorage,
    		index,
    		playersVisible,
    		newTeamMemberName,
    		Player,
    		addPlayer,
    		removePlayer,
    		removeTeam,
    		$teams
    	});

    	$$self.$inject_state = $$props => {
    		if ('index' in $$props) $$invalidate(0, index = $$props.index);
    		if ('playersVisible' in $$props) $$invalidate(1, playersVisible = $$props.playersVisible);
    		if ('newTeamMemberName' in $$props) $$invalidate(2, newTeamMemberName = $$props.newTeamMemberName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		index,
    		playersVisible,
    		newTeamMemberName,
    		$teams,
    		addPlayer,
    		removePlayer,
    		removeTeam,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		input_input_handler,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class HomeTeamsCollapsible extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, { index: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "HomeTeamsCollapsible",
    			options,
    			id: create_fragment$9.name
    		});
    	}

    	get index() {
    		throw new Error("<HomeTeamsCollapsible>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set index(value) {
    		throw new Error("<HomeTeamsCollapsible>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\components\Home.svelte generated by Svelte v3.59.2 */
    const file$a = "src\\components\\Home.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (160:12) {#if $teams.length > 0}
    function create_if_block_1$3(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*$teams*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$5(get_each_context$5(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(target, anchor);
    				}
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$teams*/ 4) {
    				each_value = /*$teams*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$5(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$5(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
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

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(160:12) {#if $teams.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (161:12) {#each $teams as team, i}
    function create_each_block$5(ctx) {
    	let hometeamscollapsible;
    	let current;

    	hometeamscollapsible = new HomeTeamsCollapsible({
    			props: { index: /*i*/ ctx[20] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(hometeamscollapsible.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(hometeamscollapsible, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(hometeamscollapsible.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(hometeamscollapsible.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(hometeamscollapsible, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(161:12) {#each $teams as team, i}",
    		ctx
    	});

    	return block;
    }

    // (166:12) {#if $game != null}
    function create_if_block$6(ctx) {
    	let div3;
    	let div2;
    	let div1;
    	let div0;
    	let h2;
    	let t1;
    	let span;
    	let t2_value = getResumeGameDateString(/*$game*/ ctx[1].started) + "";
    	let t2;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "Resume Game";
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			attr_dev(h2, "class", "c-white mb-0");
    			add_location(h2, file$a, 170, 28, 6185);
    			attr_dev(span, "class", "c-white");
    			add_location(span, file$a, 171, 28, 6256);
    			attr_dev(div0, "class", "card-body text-center");
    			add_location(div0, file$a, 169, 24, 6120);
    			attr_dev(div1, "class", "card bg-blue");
    			add_location(div1, file$a, 168, 20, 6036);
    			attr_dev(div2, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div2, file$a, 167, 16, 5976);
    			attr_dev(div3, "class", "row justify-content-center mt-3");
    			add_location(div3, file$a, 166, 12, 5913);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, span);
    			append_dev(span, t2);

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", /*click_handler_4*/ ctx[12], false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$game*/ 2 && t2_value !== (t2_value = getResumeGameDateString(/*$game*/ ctx[1].started) + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div3);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(166:12) {#if $game != null}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div23;
    	let div6;
    	let div3;
    	let div2;
    	let div0;
    	let i0;
    	let t0;
    	let div1;
    	let i1;
    	let t1;
    	let div5;
    	let div4;
    	let h1;
    	let t3;
    	let div22;
    	let div21;
    	let div16;
    	let div15;
    	let div14;
    	let div13;
    	let div9;
    	let div7;
    	let h5;
    	let t5;
    	let div8;
    	let input;
    	let t6;
    	let div12;
    	let div10;
    	let button0;
    	let i2;
    	let t7;
    	let div11;
    	let button1;
    	let i3;
    	let t8;
    	let t9;
    	let t10;
    	let t11;
    	let div20;
    	let div19;
    	let div18;
    	let div17;
    	let h2;
    	let div23_intro;
    	let t13;
    	let toast;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$teams*/ ctx[2].length > 0 && create_if_block_1$3(ctx);
    	let if_block1 = /*$game*/ ctx[1] != null && create_if_block$6(ctx);
    	toast = new Toast({ $$inline: true });

    	const block = {
    		c: function create() {
    			div23 = element("div");
    			div6 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			div1 = element("div");
    			i1 = element("i");
    			t1 = space();
    			div5 = element("div");
    			div4 = element("div");
    			h1 = element("h1");
    			h1.textContent = "43 Seconds";
    			t3 = space();
    			div22 = element("div");
    			div21 = element("div");
    			div16 = element("div");
    			div15 = element("div");
    			div14 = element("div");
    			div13 = element("div");
    			div9 = element("div");
    			div7 = element("div");
    			h5 = element("h5");
    			h5.textContent = "Add Team";
    			t5 = space();
    			div8 = element("div");
    			input = element("input");
    			t6 = space();
    			div12 = element("div");
    			div10 = element("div");
    			button0 = element("button");
    			i2 = element("i");
    			t7 = space();
    			div11 = element("div");
    			button1 = element("button");
    			i3 = element("i");
    			t8 = text(" Teams");
    			t9 = space();
    			if (if_block0) if_block0.c();
    			t10 = space();
    			if (if_block1) if_block1.c();
    			t11 = space();
    			div20 = element("div");
    			div19 = element("div");
    			div18 = element("div");
    			div17 = element("div");
    			h2 = element("h2");
    			h2.textContent = "New Game";
    			t13 = space();
    			create_component(toast.$$.fragment);
    			attr_dev(i0, "class", "c-white fas fa-question-circle");
    			add_location(i0, file$a, 119, 20, 3722);
    			attr_dev(div0, "class", "float-start");
    			add_location(div0, file$a, 118, 16, 3628);
    			attr_dev(i1, "class", "c-white fas fa-cog");
    			add_location(i1, file$a, 122, 20, 3906);
    			attr_dev(div1, "class", "float-end");
    			add_location(div1, file$a, 121, 16, 3810);
    			attr_dev(div2, "class", "col-12");
    			add_location(div2, file$a, 117, 12, 3590);
    			attr_dev(div3, "class", "row mb-3");
    			add_location(div3, file$a, 116, 8, 3554);
    			attr_dev(h1, "class", "c-white");
    			add_location(h1, file$a, 128, 16, 4091);
    			attr_dev(div4, "class", "col-12 text-center");
    			add_location(div4, file$a, 127, 12, 4041);
    			attr_dev(div5, "class", "row");
    			add_location(div5, file$a, 126, 8, 4010);
    			attr_dev(div6, "class", "container-fluid pt-2");
    			add_location(div6, file$a, 115, 4, 3510);
    			attr_dev(h5, "class", "text-center");
    			add_location(h5, file$a, 139, 52, 4552);
    			attr_dev(div7, "class", "col-12");
    			add_location(div7, file$a, 139, 32, 4532);
    			attr_dev(input, "class", "form-control");
    			attr_dev(input, "type", "text");
    			attr_dev(input, "placeholder", "Team Name");
    			add_location(input, file$a, 141, 36, 4687);
    			attr_dev(div8, "class", "col-12");
    			add_location(div8, file$a, 140, 32, 4629);
    			attr_dev(div9, "class", "row mb-2");
    			add_location(div9, file$a, 138, 28, 4476);
    			attr_dev(i2, "class", "fas fa-plus-square");
    			add_location(i2, file$a, 147, 69, 5151);
    			attr_dev(button0, "class", "btn bg-blue w-100 c-white");
    			add_location(button0, file$a, 146, 36, 5039);
    			attr_dev(div10, "class", "col-12 col-sm-6 col-md-4 mb-2");
    			add_location(div10, file$a, 145, 32, 4958);
    			attr_dev(i3, "class", "fas fa-trash-alt");
    			add_location(i3, file$a, 151, 72, 5464);
    			attr_dev(button1, "class", "btn bg-red w-100 c-white");
    			add_location(button1, file$a, 150, 36, 5349);
    			attr_dev(div11, "class", "col-12 col-sm-6 col-md-4 mb-2");
    			add_location(div11, file$a, 149, 32, 5268);
    			attr_dev(div12, "class", "row justify-content-center");
    			add_location(div12, file$a, 144, 28, 4884);
    			attr_dev(div13, "class", "card-body");
    			add_location(div13, file$a, 137, 24, 4423);
    			attr_dev(div14, "class", "card mb-3");
    			add_location(div14, file$a, 136, 20, 4374);
    			attr_dev(div15, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div15, file$a, 135, 16, 4314);
    			attr_dev(div16, "class", "row justify-content-center");
    			add_location(div16, file$a, 134, 12, 4256);
    			attr_dev(h2, "class", "c-white mb-0");
    			add_location(h2, file$a, 182, 28, 6740);
    			attr_dev(div17, "class", "card-body text-center");
    			add_location(div17, file$a, 181, 24, 6675);
    			attr_dev(div18, "class", "card bg-blue");
    			add_location(div18, file$a, 180, 20, 6592);
    			attr_dev(div19, "class", "col-12 col-md-8 col-lg-6");
    			add_location(div19, file$a, 179, 16, 6532);
    			attr_dev(div20, "class", "row justify-content-center mt-3 mb-3");
    			add_location(div20, file$a, 178, 12, 6464);
    			attr_dev(div21, "class", "container");
    			add_location(div21, file$a, 133, 8, 4219);
    			attr_dev(div22, "class", "vertical-center");
    			add_location(div22, file$a, 132, 4, 4180);
    			add_location(div23, file$a, 114, 0, 3492);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div23, anchor);
    			append_dev(div23, div6);
    			append_dev(div6, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div0, i0);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, i1);
    			append_dev(div6, t1);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, h1);
    			append_dev(div23, t3);
    			append_dev(div23, div22);
    			append_dev(div22, div21);
    			append_dev(div21, div16);
    			append_dev(div16, div15);
    			append_dev(div15, div14);
    			append_dev(div14, div13);
    			append_dev(div13, div9);
    			append_dev(div9, div7);
    			append_dev(div7, h5);
    			append_dev(div9, t5);
    			append_dev(div9, div8);
    			append_dev(div8, input);
    			set_input_value(input, /*newTeamName*/ ctx[0]);
    			append_dev(div13, t6);
    			append_dev(div13, div12);
    			append_dev(div12, div10);
    			append_dev(div10, button0);
    			append_dev(button0, i2);
    			append_dev(div12, t7);
    			append_dev(div12, div11);
    			append_dev(div11, button1);
    			append_dev(button1, i3);
    			append_dev(button1, t8);
    			append_dev(div21, t9);
    			if (if_block0) if_block0.m(div21, null);
    			append_dev(div21, t10);
    			if (if_block1) if_block1.m(div21, null);
    			append_dev(div21, t11);
    			append_dev(div21, div20);
    			append_dev(div20, div19);
    			append_dev(div19, div18);
    			append_dev(div18, div17);
    			append_dev(div17, h2);
    			insert_dev(target, t13, anchor);
    			mount_component(toast, target, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[7], false, false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[8], false, false, false, false),
    					listen_dev(input, "input", /*input_input_handler*/ ctx[9]),
    					listen_dev(button0, "click", /*click_handler_2*/ ctx[10], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_3*/ ctx[11], false, false, false, false),
    					listen_dev(div18, "click", /*click_handler_5*/ ctx[13], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*newTeamName*/ 1 && input.value !== /*newTeamName*/ ctx[0]) {
    				set_input_value(input, /*newTeamName*/ ctx[0]);
    			}

    			if (/*$teams*/ ctx[2].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*$teams*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div21, t10);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*$game*/ ctx[1] != null) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(div21, t11);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);

    			if (!div23_intro) {
    				add_render_callback(() => {
    					div23_intro = create_in_transition(div23, fly, {});
    					div23_intro.start();
    				});
    			}

    			transition_in(toast.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(toast.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div23);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (detaching) detach_dev(t13);
    			destroy_component(toast, detaching);
    			mounted = false;
    			run_all(dispose);
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

    function getResumeGameDateString(dt) {
    	let m = new Date(dt);
    	let h = m.getUTCHours() + 1;
    	if (h.toString().length == 1) h = "0" + h;
    	let min = m.getUTCMinutes();
    	if (min.toString().length == 1) min = "0" + min;
    	let sec = m.getUTCSeconds();
    	if (sec.toString().length == 1) sec = "0" + sec;
    	return m.getUTCDate() + "/" + (m.getUTCMonth() + 1) + "/" + m.getUTCFullYear() + " " + h + ":" + min + ":" + sec;
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let $game;
    	let $localStorage;
    	let $teams;
    	validate_store(game, 'game');
    	component_subscribe($$self, game, $$value => $$invalidate(1, $game = $$value));
    	validate_store(localStorage, 'localStorage');
    	component_subscribe($$self, localStorage, $$value => $$invalidate(14, $localStorage = $$value));
    	validate_store(teams, 'teams');
    	component_subscribe($$self, teams, $$value => $$invalidate(2, $teams = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('Home', slots, []);

    	class Game {
    		constructor(teams) {
    			this.teams = teams;
    			this.round = 0;
    			this.started;
    			this.words = [];
    		}
    	}

    	class Team {
    		constructor(name) {
    			this.name = name;
    			this.players = [];
    			this.points = 0;
    		}
    	}

    	onMount(async () => {
    		init();
    	});

    	function init() {
    		//Recover from Local Storage
    		let teamsFromStorage = $localStorage.getItem('teams');

    		if (teamsFromStorage != null) {
    			teams.set(JSON.parse(teamsFromStorage));
    		}

    		let gameFromStorage = $localStorage.getItem('game');

    		if (gameFromStorage != null) {
    			game.set(JSON.parse(gameFromStorage));
    		}

    		let settingsFromStorage = $localStorage.getItem('settings');

    		if (settingsFromStorage != null) {
    			settings.set(JSON.parse(settingsFromStorage));
    		}
    	}

    	function addTeam() {
    		if (newTeamName.length < 1) {
    			window.pushToast("Fill in a team name");
    			return;
    		}

    		let team = new Team(newTeamName);
    		$teams.push(team);

    		//Reactivity
    		teams.set($teams);

    		$$invalidate(0, newTeamName = "");
    		saveTeamsToLocalStorage();
    	}

    	function resetTeams() {
    		teams.set([]);
    		$localStorage.removeItem('teams');
    	}

    	function startGame() {
    		let canStart = true;

    		if ($teams.length < 2) {
    			canStart = false;
    			window.pushToast("There must be 2 teams or more to start the game");
    			return;
    		}

    		$teams.forEach(team => {
    			if (team.players.length < 2) {
    				canStart = false;
    				window.pushToast("Team " + team.name + " has less than 2 players");
    				return;
    			}
    		});

    		if (canStart) {
    			window.clearToasts();
    			game.set(new Game($teams));
    			set_store_value(game, $game.started = new Date(), $game);
    			$localStorage.setItem('game', JSON.stringify($game));
    			prevGameScreen.set(ChooseListScreen);
    			currentGameScreen.set(ChooseListScreen);
    		}
    	}

    	function resumeGame() {
    		window.clearToasts();
    		prevGameScreen.set(InterimScore);
    		currentGameScreen.set(InterimScore);
    	}

    	let newTeamName = "";
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => currentGameScreen.set(Help);
    	const click_handler_1 = () => currentGameScreen.set(Settings);

    	function input_input_handler() {
    		newTeamName = this.value;
    		$$invalidate(0, newTeamName);
    	}

    	const click_handler_2 = () => addTeam();
    	const click_handler_3 = () => resetTeams();
    	const click_handler_4 = () => resumeGame();
    	const click_handler_5 = () => startGame();

    	$$self.$capture_state = () => ({
    		onMount,
    		InterimScore,
    		Settings,
    		Toast,
    		Help,
    		currentGameScreen,
    		game,
    		localStorage,
    		settings,
    		prevGameScreen,
    		fly,
    		ChooseListScreen,
    		HomeTeamsCollapsible,
    		teams,
    		saveTeamsToLocalStorage,
    		Game,
    		Team,
    		init,
    		addTeam,
    		resetTeams,
    		startGame,
    		resumeGame,
    		getResumeGameDateString,
    		newTeamName,
    		$game,
    		$localStorage,
    		$teams
    	});

    	$$self.$inject_state = $$props => {
    		if ('newTeamName' in $$props) $$invalidate(0, newTeamName = $$props.newTeamName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		newTeamName,
    		$game,
    		$teams,
    		addTeam,
    		resetTeams,
    		startGame,
    		resumeGame,
    		click_handler,
    		click_handler_1,
    		input_input_handler,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5
    	];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src\App.svelte generated by Svelte v3.59.2 */

    const file$b = "src\\App.svelte";

    function create_fragment$b(ctx) {
    	let main;
    	let switch_instance;
    	let current;
    	var switch_value = /*$currentGameScreen*/ ctx[0];

    	function switch_props(ctx) {
    		return { $$inline: true };
    	}

    	if (switch_value) {
    		switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			attr_dev(main, "class", " svelte-1ezdhtd");
    			add_location(main, file$b, 13, 0, 330);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			if (switch_instance) mount_component(switch_instance, main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$currentGameScreen*/ 1 && switch_value !== (switch_value = /*$currentGameScreen*/ ctx[0])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = construct_svelte_component_dev(switch_value, switch_props());
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $currentGameScreen;
    	validate_store(currentGameScreen, 'currentGameScreen');
    	component_subscribe($$self, currentGameScreen, $$value => $$invalidate(0, $currentGameScreen = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);

    	onMount(() => {
    		currentGameScreen.set(Home);
    		prevGameScreen.set(Home);
    		localStorage.set(window.localStorage);
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		Home,
    		onMount,
    		currentGameScreen,
    		localStorage,
    		prevGameScreen,
    		$currentGameScreen
    	});

    	return [$currentGameScreen];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
