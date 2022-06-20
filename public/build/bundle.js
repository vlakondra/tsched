
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
    function assign$1(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
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
            ? assign$1($$scope.ctx.slice(), definition[1](fn(ctx)))
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
    function update_slot(slot, slot_definition, ctx, $$scope, dirty, get_slot_changes_fn, get_slot_context_fn) {
        const slot_changes = get_slot_changes(slot_definition, $$scope, dirty, get_slot_changes_fn);
        if (slot_changes) {
            const slot_context = get_slot_context(slot_definition, ctx, $$scope, get_slot_context_fn);
            slot.p(slot_context, slot_changes);
        }
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
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

    // Track which nodes are claimed during hydration. Unclaimed nodes can then be removed from the DOM
    // at the end of hydration without touching the remaining nodes.
    let is_hydrating = false;
    function start_hydrating() {
        is_hydrating = true;
    }
    function end_hydrating() {
        is_hydrating = false;
    }
    function upper_bound(low, high, key, value) {
        // Return first index of value larger than input value in the range [low, high)
        while (low < high) {
            const mid = low + ((high - low) >> 1);
            if (key(mid) <= value) {
                low = mid + 1;
            }
            else {
                high = mid;
            }
        }
        return low;
    }
    function init_hydrate(target) {
        if (target.hydrate_init)
            return;
        target.hydrate_init = true;
        // We know that all children have claim_order values since the unclaimed have been detached
        const children = target.childNodes;
        /*
        * Reorder claimed children optimally.
        * We can reorder claimed children optimally by finding the longest subsequence of
        * nodes that are already claimed in order and only moving the rest. The longest
        * subsequence subsequence of nodes that are claimed in order can be found by
        * computing the longest increasing subsequence of .claim_order values.
        *
        * This algorithm is optimal in generating the least amount of reorder operations
        * possible.
        *
        * Proof:
        * We know that, given a set of reordering operations, the nodes that do not move
        * always form an increasing subsequence, since they do not move among each other
        * meaning that they must be already ordered among each other. Thus, the maximal
        * set of nodes that do not move form a longest increasing subsequence.
        */
        // Compute longest increasing subsequence
        // m: subsequence length j => index k of smallest value that ends an increasing subsequence of length j
        const m = new Int32Array(children.length + 1);
        // Predecessor indices + 1
        const p = new Int32Array(children.length);
        m[0] = -1;
        let longest = 0;
        for (let i = 0; i < children.length; i++) {
            const current = children[i].claim_order;
            // Find the largest subsequence length such that it ends in a value less than our current value
            // upper_bound returns first greater value, so we subtract one
            const seqLen = upper_bound(1, longest + 1, idx => children[m[idx]].claim_order, current) - 1;
            p[i] = m[seqLen] + 1;
            const newLen = seqLen + 1;
            // We can guarantee that current is the smallest value. Otherwise, we would have generated a longer sequence.
            m[newLen] = i;
            longest = Math.max(newLen, longest);
        }
        // The longest increasing subsequence of nodes (initially reversed)
        const lis = [];
        // The rest of the nodes, nodes that will be moved
        const toMove = [];
        let last = children.length - 1;
        for (let cur = m[longest] + 1; cur != 0; cur = p[cur - 1]) {
            lis.push(children[cur - 1]);
            for (; last >= cur; last--) {
                toMove.push(children[last]);
            }
            last--;
        }
        for (; last >= 0; last--) {
            toMove.push(children[last]);
        }
        lis.reverse();
        // We sort the nodes being moved to guarantee that their insertion order matches the claim order
        toMove.sort((a, b) => a.claim_order - b.claim_order);
        // Finally, we move the nodes
        for (let i = 0, j = 0; i < toMove.length; i++) {
            while (j < lis.length && toMove[i].claim_order >= lis[j].claim_order) {
                j++;
            }
            const anchor = j < lis.length ? lis[j] : null;
            target.insertBefore(toMove[i], anchor);
        }
    }
    function append(target, node) {
        if (is_hydrating) {
            init_hydrate(target);
            if ((target.actual_end_child === undefined) || ((target.actual_end_child !== null) && (target.actual_end_child.parentElement !== target))) {
                target.actual_end_child = target.firstChild;
            }
            if (node !== target.actual_end_child) {
                target.insertBefore(node, target.actual_end_child);
            }
            else {
                target.actual_end_child = node.nextSibling;
            }
        }
        else if (node.parentNode !== target) {
            target.appendChild(node);
        }
    }
    function insert(target, node, anchor) {
        if (is_hydrating && !anchor) {
            append(target, node);
        }
        else if (node.parentNode !== target || (anchor && node.nextSibling !== anchor)) {
            target.insertBefore(node, anchor || null);
        }
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
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function select_option(select, value) {
        for (let i = 0; i < select.options.length; i += 1) {
            const option = select.options[i];
            if (option.__value === value) {
                option.selected = true;
                return;
            }
        }
    }
    function select_value(select) {
        const selected_option = select.querySelector(':checked') || select.options[0];
        return selected_option && selected_option.__value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
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
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
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
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
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
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    }
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
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
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
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
        let config = fn(node, params);
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
                config = config();
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
    function create_bidirectional_transition(node, fn, params, intro) {
        let config = fn(node, params);
        let t = intro ? 0 : 1;
        let running_program = null;
        let pending_program = null;
        let animation_name = null;
        function clear_animation() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function init(program, duration) {
            const d = program.b - t;
            duration *= Math.abs(d);
            return {
                a: t,
                b: program.b,
                d,
                duration,
                start: program.start,
                end: program.start + duration,
                group: program.group
            };
        }
        function go(b) {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            const program = {
                start: now() + delay,
                b
            };
            if (!b) {
                // @ts-ignore todo: improve typings
                program.group = outros;
                outros.r += 1;
            }
            if (running_program || pending_program) {
                pending_program = program;
            }
            else {
                // if this is an intro, and there's a delay, we need to do
                // an initial tick and/or apply CSS animation immediately
                if (css) {
                    clear_animation();
                    animation_name = create_rule(node, t, b, duration, delay, easing, css);
                }
                if (b)
                    tick(0, 1);
                running_program = init(program, duration);
                add_render_callback(() => dispatch(node, b, 'start'));
                loop(now => {
                    if (pending_program && now > pending_program.start) {
                        running_program = init(pending_program, duration);
                        pending_program = null;
                        dispatch(node, running_program.b, 'start');
                        if (css) {
                            clear_animation();
                            animation_name = create_rule(node, t, running_program.b, running_program.duration, 0, easing, config.css);
                        }
                    }
                    if (running_program) {
                        if (now >= running_program.end) {
                            tick(t = running_program.b, 1 - t);
                            dispatch(node, running_program.b, 'end');
                            if (!pending_program) {
                                // we're done
                                if (running_program.b) {
                                    // intro — we can tidy up immediately
                                    clear_animation();
                                }
                                else {
                                    // outro — needs to be coordinated
                                    if (!--running_program.group.r)
                                        run_all(running_program.group.c);
                                }
                            }
                            running_program = null;
                        }
                        else if (now >= running_program.start) {
                            const p = now - running_program.start;
                            t = running_program.a + running_program.d * easing(p / running_program.duration);
                            tick(t, 1 - t);
                        }
                    }
                    return !!(running_program || pending_program);
                });
            }
        }
        return {
            run(b) {
                if (is_function(config)) {
                    wait().then(() => {
                        // @ts-ignore
                        config = config();
                        go(b);
                    });
                }
                else {
                    go(b);
                }
            },
            end() {
                clear_animation();
                running_program = pending_program = null;
            }
        };
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
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
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
            context: new Map(parent_component ? parent_component.$$.context : options.context || []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
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
                start_hydrating();
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
            end_hydrating();
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
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.38.3' }, detail)));
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

    function styleInject(css, ref) {
      if ( ref === void 0 ) ref = {};
      var insertAt = ref.insertAt;

      if (!css || typeof document === 'undefined') { return; }

      var head = document.head || document.getElementsByTagName('head')[0];
      var style = document.createElement('style');
      style.type = 'text/css';

      if (insertAt === 'top') {
        if (head.firstChild) {
          head.insertBefore(style, head.firstChild);
        } else {
          head.appendChild(style);
        }
      } else {
        head.appendChild(style);
      }

      if (style.styleSheet) {
        style.styleSheet.cssText = css;
      } else {
        style.appendChild(document.createTextNode(css));
      }
    }

    var css_248z$e = "";
    styleInject(css_248z$e);

    var css_248z$d = "";
    styleInject(css_248z$d);

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
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }

    //часы для header'a
    const time = readable(new Date(), function start(set) {
    	const interval = setInterval(() => {
    		set(new Date());
    	}, 1000);

    	return function stop() {
    		clearInterval(interval);
    	};
    });


    const load_ini_data= writable(false);
    const load_sched_data= writable(false);

    const err_ini_data= writable(false);
    const err_sched_data= writable(false);

    const depart_id = writable(null);
    const teacher_id = writable(null);

    const d_start = writable(null);
    const d_end = writable(null);
    const  scheddata=writable({});
    const sched_data_loaded=writable(false); //была  загрузка расписания - не показ-ть startmessage
    const client_width = writable(0); //ширина экрана от ResizeObserver



    const esc = encodeURIComponent;
    const buildparams =(pars)=>{
         Object.keys(pars)
        .map((k) => `${esc(k)}=${esc(pars[k])}`)
        .join("&");
    };
    //загрузка данных по кафедрам. импортируется depart.svelte
    function departData (){
        const url = "https://old.ursei.su/Services/GetTeachersIniData?";
        const params = {
          //почему работает с любой датой?
          d: new Date().toISOString().slice(0, 10),
        };
        let query = buildparams(params);
        // const query = Object.keys(params)
        //   .map((k) => `${esc(k)}=${esc(params[k])}`)
        //   .join("&");

        const loading = writable(true); //оставить только data и export-переменные
        const error = writable(false);
    	const data = writable({});  
       

        async function get() {
            loading.set(true);
            error.set(false);
            load_ini_data.set(true);
            try {
                const response = await fetch(url + query);
                data.set(await response.json());
            } catch(e) {
                error.set(e);
                err_ini_data.set(e);
            }
            loading.set(false);
            load_ini_data.set(false);
        }

        get();

        return [loading, error,data];
    }

    async function getSched(par){
        let dstart,dend,departid,empid;

        d_start.subscribe((v)=>dstart=new Date(v).toLocaleDateString('ru-RU'));
        d_end.subscribe((v)=>dend=new Date(v).toLocaleDateString('ru-RU'));
        depart_id.subscribe((v)=>departid=v);
        teacher_id.subscribe((v)=>empid=v);

        load_sched_data.set(true);
        const url='https://old.ursei.su/Services/GetTeacherSched?';
        const params = {
            departid:departid,
            empid:empid,
            dstart:dstart,
            dend:dend
          };
        //    let query = buildparams(params)
          const query = Object.keys(params)
          .map((k) => `${esc(k)}=${esc(params[k])}`)
          .join("&");

          try {
            const response = await fetch(url + query);
            scheddata.set( await response.json());  
            sched_data_loaded.set(true);
            //Позиционируем на сегодня, если есть в расписании
            setTimeout(() => {
                let dp = document.getElementById(
                    new Date().toISOString().slice(0, 10)
                );
                if (dp) {
                    dp.scrollIntoView({ block: "start", behavior: "smooth" });
                }else {
                    document.body.scrollIntoView();
                }
            }, 500);
         
        } catch(e) {
            sched_data_loaded.set(true);
            err_sched_data.set(e);
        }
        load_sched_data.set(false);

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

    const parseNumber = parseFloat;

    function joinCss(obj, separator = ';') {
      let texts;
      if (Array.isArray(obj)) {
        texts = obj.filter((text) => text);
      } else {
        texts = [];
        for (const prop in obj) {
          if (obj[prop]) {
            texts.push(`${prop}:${obj[prop]}`);
          }
        }
      }
      return texts.join(separator);
    }

    function getStyles(style, size, pull, fw) {
      let float;
      let width;
      const height = '1em';
      let lineHeight;
      let fontSize;
      let textAlign;
      let verticalAlign = '-.125em';
      const overflow = 'visible';

      if (fw) {
        textAlign = 'center';
        width = '1.25em';
      }

      if (pull) {
        float = pull;
      }

      if (size) {
        if (size == 'lg') {
          fontSize = '1.33333em';
          lineHeight = '.75em';
          verticalAlign = '-.225em';
        } else if (size == 'xs') {
          fontSize = '.75em';
        } else if (size == 'sm') {
          fontSize = '.875em';
        } else {
          fontSize = size.replace('x', 'em');
        }
      }

      return joinCss([
        joinCss({
          float,
          width,
          height,
          'line-height': lineHeight,
          'font-size': fontSize,
          'text-align': textAlign,
          'vertical-align': verticalAlign,
          'transform-origin': 'center',
          overflow,
        }),
        style,
      ]);
    }

    function getTransform(
      scale,
      translateX,
      translateY,
      rotate,
      flip,
      translateTimes = 1,
      translateUnit = '',
      rotateUnit = '',
    ) {
      let flipX = 1;
      let flipY = 1;

      if (flip) {
        if (flip == 'horizontal') {
          flipX = -1;
        } else if (flip == 'vertical') {
          flipY = -1;
        } else {
          flipX = flipY = -1;
        }
      }

      return joinCss(
        [
          `translate(${parseNumber(translateX) * translateTimes}${translateUnit},${parseNumber(translateY) * translateTimes}${translateUnit})`,
          `scale(${flipX * parseNumber(scale)},${flipY * parseNumber(scale)})`,
          rotate && `rotate(${rotate}${rotateUnit})`,
        ],
        ' ',
      );
    }

    var css_248z$c = "";
    styleInject(css_248z$c);

    /* node_modules/svelte-fa/src/fa.svelte generated by Svelte v3.38.3 */
    const file$g = "node_modules/svelte-fa/src/fa.svelte";

    // (78:0) {#if i[4]}
    function create_if_block$8(ctx) {
    	let svg;
    	let g1;
    	let g0;
    	let g1_transform_value;
    	let g1_transform_origin_value;
    	let svg_class_value;
    	let svg_viewBox_value;

    	function select_block_type(ctx, dirty) {
    		if (typeof /*i*/ ctx[7][4] == "string") return create_if_block_1$6;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			g1 = svg_element("g");
    			g0 = svg_element("g");
    			if_block.c();
    			attr_dev(g0, "transform", /*transform*/ ctx[10]);
    			add_location(g0, file$g, 91, 6, 1469);
    			attr_dev(g1, "transform", g1_transform_value = `translate(${/*i*/ ctx[7][0] / 2} ${/*i*/ ctx[7][1] / 2})`);
    			attr_dev(g1, "transform-origin", g1_transform_origin_value = `${/*i*/ ctx[7][0] / 4} 0`);
    			add_location(g1, file$g, 87, 4, 1358);
    			attr_dev(svg, "id", /*id*/ ctx[0]);
    			attr_dev(svg, "class", svg_class_value = "" + (null_to_empty(/*c*/ ctx[8]) + " svelte-1cj2gr0"));
    			attr_dev(svg, "style", /*s*/ ctx[9]);
    			attr_dev(svg, "viewBox", svg_viewBox_value = `0 0 ${/*i*/ ctx[7][0]} ${/*i*/ ctx[7][1]}`);
    			attr_dev(svg, "aria-hidden", "true");
    			attr_dev(svg, "role", "img");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			add_location(svg, file$g, 78, 2, 1195);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, g1);
    			append_dev(g1, g0);
    			if_block.m(g0, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(g0, null);
    				}
    			}

    			if (dirty & /*transform*/ 1024) {
    				attr_dev(g0, "transform", /*transform*/ ctx[10]);
    			}

    			if (dirty & /*i*/ 128 && g1_transform_value !== (g1_transform_value = `translate(${/*i*/ ctx[7][0] / 2} ${/*i*/ ctx[7][1] / 2})`)) {
    				attr_dev(g1, "transform", g1_transform_value);
    			}

    			if (dirty & /*i*/ 128 && g1_transform_origin_value !== (g1_transform_origin_value = `${/*i*/ ctx[7][0] / 4} 0`)) {
    				attr_dev(g1, "transform-origin", g1_transform_origin_value);
    			}

    			if (dirty & /*id*/ 1) {
    				attr_dev(svg, "id", /*id*/ ctx[0]);
    			}

    			if (dirty & /*c*/ 256 && svg_class_value !== (svg_class_value = "" + (null_to_empty(/*c*/ ctx[8]) + " svelte-1cj2gr0"))) {
    				attr_dev(svg, "class", svg_class_value);
    			}

    			if (dirty & /*s*/ 512) {
    				attr_dev(svg, "style", /*s*/ ctx[9]);
    			}

    			if (dirty & /*i*/ 128 && svg_viewBox_value !== (svg_viewBox_value = `0 0 ${/*i*/ ctx[7][0]} ${/*i*/ ctx[7][1]}`)) {
    				attr_dev(svg, "viewBox", svg_viewBox_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$8.name,
    		type: "if",
    		source: "(78:0) {#if i[4]}",
    		ctx
    	});

    	return block;
    }

    // (99:8) {:else}
    function create_else_block$3(ctx) {
    	let path0;
    	let path0_d_value;
    	let path0_fill_value;
    	let path0_fill_opacity_value;
    	let path0_transform_value;
    	let path1;
    	let path1_d_value;
    	let path1_fill_value;
    	let path1_fill_opacity_value;
    	let path1_transform_value;

    	const block = {
    		c: function create() {
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", path0_d_value = /*i*/ ctx[7][4][0]);
    			attr_dev(path0, "fill", path0_fill_value = /*secondaryColor*/ ctx[3] || /*color*/ ctx[1] || "currentColor");

    			attr_dev(path0, "fill-opacity", path0_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*primaryOpacity*/ ctx[4]
    			: /*secondaryOpacity*/ ctx[5]);

    			attr_dev(path0, "transform", path0_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`);
    			add_location(path0, file$g, 99, 10, 1721);
    			attr_dev(path1, "d", path1_d_value = /*i*/ ctx[7][4][1]);
    			attr_dev(path1, "fill", path1_fill_value = /*primaryColor*/ ctx[2] || /*color*/ ctx[1] || "currentColor");

    			attr_dev(path1, "fill-opacity", path1_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*secondaryOpacity*/ ctx[5]
    			: /*primaryOpacity*/ ctx[4]);

    			attr_dev(path1, "transform", path1_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`);
    			add_location(path1, file$g, 105, 10, 1982);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path0, anchor);
    			insert_dev(target, path1, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 128 && path0_d_value !== (path0_d_value = /*i*/ ctx[7][4][0])) {
    				attr_dev(path0, "d", path0_d_value);
    			}

    			if (dirty & /*secondaryColor, color*/ 10 && path0_fill_value !== (path0_fill_value = /*secondaryColor*/ ctx[3] || /*color*/ ctx[1] || "currentColor")) {
    				attr_dev(path0, "fill", path0_fill_value);
    			}

    			if (dirty & /*swapOpacity, primaryOpacity, secondaryOpacity*/ 112 && path0_fill_opacity_value !== (path0_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*primaryOpacity*/ ctx[4]
    			: /*secondaryOpacity*/ ctx[5])) {
    				attr_dev(path0, "fill-opacity", path0_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 128 && path0_transform_value !== (path0_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`)) {
    				attr_dev(path0, "transform", path0_transform_value);
    			}

    			if (dirty & /*i*/ 128 && path1_d_value !== (path1_d_value = /*i*/ ctx[7][4][1])) {
    				attr_dev(path1, "d", path1_d_value);
    			}

    			if (dirty & /*primaryColor, color*/ 6 && path1_fill_value !== (path1_fill_value = /*primaryColor*/ ctx[2] || /*color*/ ctx[1] || "currentColor")) {
    				attr_dev(path1, "fill", path1_fill_value);
    			}

    			if (dirty & /*swapOpacity, secondaryOpacity, primaryOpacity*/ 112 && path1_fill_opacity_value !== (path1_fill_opacity_value = /*swapOpacity*/ ctx[6] != false
    			? /*secondaryOpacity*/ ctx[5]
    			: /*primaryOpacity*/ ctx[4])) {
    				attr_dev(path1, "fill-opacity", path1_fill_opacity_value);
    			}

    			if (dirty & /*i*/ 128 && path1_transform_value !== (path1_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`)) {
    				attr_dev(path1, "transform", path1_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path0);
    			if (detaching) detach_dev(path1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(99:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (93:8) {#if typeof i[4] == 'string'}
    function create_if_block_1$6(ctx) {
    	let path;
    	let path_d_value;
    	let path_fill_value;
    	let path_transform_value;

    	const block = {
    		c: function create() {
    			path = svg_element("path");
    			attr_dev(path, "d", path_d_value = /*i*/ ctx[7][4]);
    			attr_dev(path, "fill", path_fill_value = /*color*/ ctx[1] || /*primaryColor*/ ctx[2] || "currentColor");
    			attr_dev(path, "transform", path_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`);
    			add_location(path, file$g, 93, 10, 1533);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, path, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*i*/ 128 && path_d_value !== (path_d_value = /*i*/ ctx[7][4])) {
    				attr_dev(path, "d", path_d_value);
    			}

    			if (dirty & /*color, primaryColor*/ 6 && path_fill_value !== (path_fill_value = /*color*/ ctx[1] || /*primaryColor*/ ctx[2] || "currentColor")) {
    				attr_dev(path, "fill", path_fill_value);
    			}

    			if (dirty & /*i*/ 128 && path_transform_value !== (path_transform_value = `translate(${/*i*/ ctx[7][0] / -2} ${/*i*/ ctx[7][1] / -2})`)) {
    				attr_dev(path, "transform", path_transform_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(path);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$6.name,
    		type: "if",
    		source: "(93:8) {#if typeof i[4] == 'string'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$g(ctx) {
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[7][4] && create_if_block$8(ctx);

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
    			if (/*i*/ ctx[7][4]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$8(ctx);
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
    		id: create_fragment$g.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$g($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Fa", slots, []);
    	let { class: clazz = "" } = $$props;
    	let { id = "" } = $$props;
    	let { style = "" } = $$props;
    	let { icon } = $$props;
    	let { size = "" } = $$props;
    	let { color = "" } = $$props;
    	let { fw = false } = $$props;
    	let { pull = "" } = $$props;
    	let { scale = 1 } = $$props;
    	let { translateX = 0 } = $$props;
    	let { translateY = 0 } = $$props;
    	let { rotate = "" } = $$props;
    	let { flip = false } = $$props;
    	let { spin = false } = $$props;
    	let { pulse = false } = $$props;
    	let { primaryColor = "" } = $$props;
    	let { secondaryColor = "" } = $$props;
    	let { primaryOpacity = 1 } = $$props;
    	let { secondaryOpacity = 0.4 } = $$props;
    	let { swapOpacity = false } = $$props;
    	let i;
    	let c;
    	let s;
    	let transform;

    	const writable_props = [
    		"class",
    		"id",
    		"style",
    		"icon",
    		"size",
    		"color",
    		"fw",
    		"pull",
    		"scale",
    		"translateX",
    		"translateY",
    		"rotate",
    		"flip",
    		"spin",
    		"pulse",
    		"primaryColor",
    		"secondaryColor",
    		"primaryOpacity",
    		"secondaryOpacity",
    		"swapOpacity"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Fa> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("class" in $$props) $$invalidate(11, clazz = $$props.class);
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("style" in $$props) $$invalidate(12, style = $$props.style);
    		if ("icon" in $$props) $$invalidate(13, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(14, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("fw" in $$props) $$invalidate(15, fw = $$props.fw);
    		if ("pull" in $$props) $$invalidate(16, pull = $$props.pull);
    		if ("scale" in $$props) $$invalidate(17, scale = $$props.scale);
    		if ("translateX" in $$props) $$invalidate(18, translateX = $$props.translateX);
    		if ("translateY" in $$props) $$invalidate(19, translateY = $$props.translateY);
    		if ("rotate" in $$props) $$invalidate(20, rotate = $$props.rotate);
    		if ("flip" in $$props) $$invalidate(21, flip = $$props.flip);
    		if ("spin" in $$props) $$invalidate(22, spin = $$props.spin);
    		if ("pulse" in $$props) $$invalidate(23, pulse = $$props.pulse);
    		if ("primaryColor" in $$props) $$invalidate(2, primaryColor = $$props.primaryColor);
    		if ("secondaryColor" in $$props) $$invalidate(3, secondaryColor = $$props.secondaryColor);
    		if ("primaryOpacity" in $$props) $$invalidate(4, primaryOpacity = $$props.primaryOpacity);
    		if ("secondaryOpacity" in $$props) $$invalidate(5, secondaryOpacity = $$props.secondaryOpacity);
    		if ("swapOpacity" in $$props) $$invalidate(6, swapOpacity = $$props.swapOpacity);
    	};

    	$$self.$capture_state = () => ({
    		joinCss,
    		getStyles,
    		getTransform,
    		clazz,
    		id,
    		style,
    		icon,
    		size,
    		color,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip,
    		spin,
    		pulse,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		c,
    		s,
    		transform
    	});

    	$$self.$inject_state = $$props => {
    		if ("clazz" in $$props) $$invalidate(11, clazz = $$props.clazz);
    		if ("id" in $$props) $$invalidate(0, id = $$props.id);
    		if ("style" in $$props) $$invalidate(12, style = $$props.style);
    		if ("icon" in $$props) $$invalidate(13, icon = $$props.icon);
    		if ("size" in $$props) $$invalidate(14, size = $$props.size);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    		if ("fw" in $$props) $$invalidate(15, fw = $$props.fw);
    		if ("pull" in $$props) $$invalidate(16, pull = $$props.pull);
    		if ("scale" in $$props) $$invalidate(17, scale = $$props.scale);
    		if ("translateX" in $$props) $$invalidate(18, translateX = $$props.translateX);
    		if ("translateY" in $$props) $$invalidate(19, translateY = $$props.translateY);
    		if ("rotate" in $$props) $$invalidate(20, rotate = $$props.rotate);
    		if ("flip" in $$props) $$invalidate(21, flip = $$props.flip);
    		if ("spin" in $$props) $$invalidate(22, spin = $$props.spin);
    		if ("pulse" in $$props) $$invalidate(23, pulse = $$props.pulse);
    		if ("primaryColor" in $$props) $$invalidate(2, primaryColor = $$props.primaryColor);
    		if ("secondaryColor" in $$props) $$invalidate(3, secondaryColor = $$props.secondaryColor);
    		if ("primaryOpacity" in $$props) $$invalidate(4, primaryOpacity = $$props.primaryOpacity);
    		if ("secondaryOpacity" in $$props) $$invalidate(5, secondaryOpacity = $$props.secondaryOpacity);
    		if ("swapOpacity" in $$props) $$invalidate(6, swapOpacity = $$props.swapOpacity);
    		if ("i" in $$props) $$invalidate(7, i = $$props.i);
    		if ("c" in $$props) $$invalidate(8, c = $$props.c);
    		if ("s" in $$props) $$invalidate(9, s = $$props.s);
    		if ("transform" in $$props) $$invalidate(10, transform = $$props.transform);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*icon*/ 8192) {
    			$$invalidate(7, i = icon && icon.icon || [0, 0, "", [], ""]);
    		}

    		if ($$self.$$.dirty & /*clazz, spin, pulse*/ 12584960) {
    			$$invalidate(8, c = joinCss([clazz, "svelte-fa", spin && "spin", pulse && "pulse"], " "));
    		}

    		if ($$self.$$.dirty & /*style, size, pull, fw*/ 118784) {
    			$$invalidate(9, s = getStyles(style, size, pull, fw));
    		}

    		if ($$self.$$.dirty & /*scale, translateX, translateY, rotate, flip*/ 4063232) {
    			$$invalidate(10, transform = getTransform(scale, translateX, translateY, rotate, flip, 512));
    		}
    	};

    	return [
    		id,
    		color,
    		primaryColor,
    		secondaryColor,
    		primaryOpacity,
    		secondaryOpacity,
    		swapOpacity,
    		i,
    		c,
    		s,
    		transform,
    		clazz,
    		style,
    		icon,
    		size,
    		fw,
    		pull,
    		scale,
    		translateX,
    		translateY,
    		rotate,
    		flip,
    		spin,
    		pulse
    	];
    }

    class Fa extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$g, create_fragment$g, safe_not_equal, {
    			class: 11,
    			id: 0,
    			style: 12,
    			icon: 13,
    			size: 14,
    			color: 1,
    			fw: 15,
    			pull: 16,
    			scale: 17,
    			translateX: 18,
    			translateY: 19,
    			rotate: 20,
    			flip: 21,
    			spin: 22,
    			pulse: 23,
    			primaryColor: 2,
    			secondaryColor: 3,
    			primaryOpacity: 4,
    			secondaryOpacity: 5,
    			swapOpacity: 6
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Fa",
    			options,
    			id: create_fragment$g.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*icon*/ ctx[13] === undefined && !("icon" in props)) {
    			console.warn("<Fa> was created without expected prop 'icon'");
    		}
    	}

    	get class() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set class(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get style() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set style(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get icon() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set icon(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fw() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fw(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pull() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pull(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get scale() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateX() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateX(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get translateY() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set translateY(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get rotate() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set rotate(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get flip() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set flip(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get spin() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set spin(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pulse() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pulse(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryColor() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryColor(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get primaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set primaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get secondaryOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set secondaryOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get swapOpacity() {
    		throw new Error("<Fa>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set swapOpacity(value) {
    		throw new Error("<Fa>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /*!
     * Font Awesome Free 6.1.1 by @fontawesome - https://fontawesome.com
     * License - https://fontawesome.com/license/free (Icons: CC BY 4.0, Fonts: SIL OFL 1.1, Code: MIT License)
     * Copyright 2022 Fonticons, Inc.
     */
    var faArrowsRotate = {
      prefix: 'fas',
      iconName: 'arrows-rotate',
      icon: [512, 512, [128472, "refresh", "sync"], "f021", "M464 16c-17.67 0-32 14.31-32 32v74.09C392.1 66.52 327.4 32 256 32C161.5 32 78.59 92.34 49.58 182.2c-5.438 16.81 3.797 34.88 20.61 40.28c16.89 5.5 34.88-3.812 40.3-20.59C130.9 138.5 189.4 96 256 96c50.5 0 96.26 24.55 124.4 64H336c-17.67 0-32 14.31-32 32s14.33 32 32 32h128c17.67 0 32-14.31 32-32V48C496 30.31 481.7 16 464 16zM441.8 289.6c-16.92-5.438-34.88 3.812-40.3 20.59C381.1 373.5 322.6 416 256 416c-50.5 0-96.25-24.55-124.4-64H176c17.67 0 32-14.31 32-32s-14.33-32-32-32h-128c-17.67 0-32 14.31-32 32v144c0 17.69 14.33 32 32 32s32-14.31 32-32v-74.09C119.9 445.5 184.6 480 255.1 480c94.45 0 177.4-60.34 206.4-150.2C467.9 313 458.6 294.1 441.8 289.6z"]
    };
    var faSync = faArrowsRotate;
    var faBars = {
      prefix: 'fas',
      iconName: 'bars',
      icon: [448, 512, ["navicon"], "f0c9", "M0 96C0 78.33 14.33 64 32 64H416C433.7 64 448 78.33 448 96C448 113.7 433.7 128 416 128H32C14.33 128 0 113.7 0 96zM0 256C0 238.3 14.33 224 32 224H416C433.7 224 448 238.3 448 256C448 273.7 433.7 288 416 288H32C14.33 288 0 273.7 0 256zM416 448H32C14.33 448 0 433.7 0 416C0 398.3 14.33 384 32 384H416C433.7 384 448 398.3 448 416C448 433.7 433.7 448 416 448z"]
    };
    var faCircleArrowUp = {
      prefix: 'fas',
      iconName: 'circle-arrow-up',
      icon: [512, 512, ["arrow-circle-up"], "f0aa", "M256 0C114.6 0 0 114.6 0 256c0 141.4 114.6 256 256 256s256-114.6 256-256C512 114.6 397.4 0 256 0zM382.6 254.6c-12.5 12.5-32.75 12.5-45.25 0L288 205.3V384c0 17.69-14.33 32-32 32s-32-14.31-32-32V205.3L174.6 254.6c-12.5 12.5-32.75 12.5-45.25 0s-12.5-32.75 0-45.25l103.1-103.1C241.3 97.4 251.1 96 256 96c4.881 0 14.65 1.391 22.65 9.398l103.1 103.1C395.1 221.9 395.1 242.1 382.6 254.6z"]
    };
    var faArrowCircleUp = faCircleArrowUp;
    var faSpinner = {
      prefix: 'fas',
      iconName: 'spinner',
      icon: [512, 512, [], "f110", "M304 48C304 74.51 282.5 96 256 96C229.5 96 208 74.51 208 48C208 21.49 229.5 0 256 0C282.5 0 304 21.49 304 48zM304 464C304 490.5 282.5 512 256 512C229.5 512 208 490.5 208 464C208 437.5 229.5 416 256 416C282.5 416 304 437.5 304 464zM0 256C0 229.5 21.49 208 48 208C74.51 208 96 229.5 96 256C96 282.5 74.51 304 48 304C21.49 304 0 282.5 0 256zM512 256C512 282.5 490.5 304 464 304C437.5 304 416 282.5 416 256C416 229.5 437.5 208 464 208C490.5 208 512 229.5 512 256zM74.98 437C56.23 418.3 56.23 387.9 74.98 369.1C93.73 350.4 124.1 350.4 142.9 369.1C161.6 387.9 161.6 418.3 142.9 437C124.1 455.8 93.73 455.8 74.98 437V437zM142.9 142.9C124.1 161.6 93.73 161.6 74.98 142.9C56.24 124.1 56.24 93.73 74.98 74.98C93.73 56.23 124.1 56.23 142.9 74.98C161.6 93.73 161.6 124.1 142.9 142.9zM369.1 369.1C387.9 350.4 418.3 350.4 437 369.1C455.8 387.9 455.8 418.3 437 437C418.3 455.8 387.9 455.8 369.1 437C350.4 418.3 350.4 387.9 369.1 369.1V369.1z"]
    };
    var faTableCells = {
      prefix: 'fas',
      iconName: 'table-cells',
      icon: [512, 512, ["th"], "f00a", "M448 32C483.3 32 512 60.65 512 96V416C512 451.3 483.3 480 448 480H64C28.65 480 0 451.3 0 416V96C0 60.65 28.65 32 64 32H448zM152 96H64V160H152V96zM208 160H296V96H208V160zM448 96H360V160H448V96zM64 288H152V224H64V288zM296 224H208V288H296V224zM360 288H448V224H360V288zM152 352H64V416H152V352zM208 416H296V352H208V416zM448 352H360V416H448V352z"]
    };
    var faTableList = {
      prefix: 'fas',
      iconName: 'table-list',
      icon: [512, 512, ["th-list"], "f00b", "M0 96C0 60.65 28.65 32 64 32H448C483.3 32 512 60.65 512 96V416C512 451.3 483.3 480 448 480H64C28.65 480 0 451.3 0 416V96zM64 160H128V96H64V160zM448 96H192V160H448V96zM64 288H128V224H64V288zM448 224H192V288H448V224zM64 416H128V352H64V416zM448 352H192V416H448V352z"]
    };

    var css_248z$b = "";
    styleInject(css_248z$b);

    /* src/Comps/header.svelte generated by Svelte v3.38.3 */
    const file$f = "src/Comps/header.svelte";

    function create_fragment$f(ctx) {
    	let div5;
    	let div0;
    	let t1;
    	let div3;
    	let div1;
    	let fa;
    	let t2;
    	let div2;
    	let t4;
    	let div4;
    	let t5_value = /*formatter*/ ctx[2].format(/*$time*/ ctx[1]) + "";
    	let t5;
    	let current;
    	let mounted;
    	let dispose;
    	fa = new Fa({ props: { icon: faBars }, $$inline: true });

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			div0.textContent = `${new Date().toLocaleDateString("ru-RU")}`;
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			create_component(fa.$$.fragment);
    			t2 = space();
    			div2 = element("div");
    			div2.textContent = "Расписание преподавателей";
    			t4 = space();
    			div4 = element("div");
    			t5 = text(t5_value);
    			attr_dev(div0, "class", "date svelte-1ludef0");
    			add_location(div0, file$f, 20, 4, 530);
    			attr_dev(div1, "class", "burger svelte-1ludef0");
    			add_location(div1, file$f, 24, 8, 685);
    			attr_dev(div2, "class", "caption svelte-1ludef0");
    			add_location(div2, file$f, 27, 8, 787);
    			set_style(div3, "display", "flex");
    			set_style(div3, "flex-wrap", "nowrap");
    			set_style(div3, "align-items", "center");
    			add_location(div3, file$f, 23, 4, 613);
    			attr_dev(div4, "class", "time svelte-1ludef0");
    			add_location(div4, file$f, 29, 4, 855);
    			attr_dev(div5, "id", "header");
    			attr_dev(div5, "class", "header svelte-1ludef0");
    			add_location(div5, file$f, 19, 0, 493);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div5, t1);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			mount_component(fa, div1, null);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, t5);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					div1,
    					"click",
    					function () {
    						if (is_function(/*onBurgerClick*/ ctx[0])) /*onBurgerClick*/ ctx[0].apply(this, arguments);
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
    			if ((!current || dirty & /*$time*/ 2) && t5_value !== (t5_value = /*formatter*/ ctx[2].format(/*$time*/ ctx[1]) + "")) set_data_dev(t5, t5_value);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_component(fa);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$f.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$f($$self, $$props, $$invalidate) {
    	let $time;
    	validate_store(time, "time");
    	component_subscribe($$self, time, $$value => $$invalidate(1, $time = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { onBurgerClick } = $$props;

    	// https://cweili.github.io/svelte-fa/
    	//https://www.npmjs.com/package/svelte-fa
    	//https://fontawesome.com/v5/icons/bars?s=solid
    	const formatter = new Intl.DateTimeFormat("ru",
    	{
    			hour12: false,
    			hour: "numeric",
    			minute: "2-digit",
    			second: "2-digit"
    		});

    	const writable_props = ["onBurgerClick"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("onBurgerClick" in $$props) $$invalidate(0, onBurgerClick = $$props.onBurgerClick);
    	};

    	$$self.$capture_state = () => ({
    		time,
    		onBurgerClick,
    		Fa,
    		faBars,
    		formatter,
    		$time
    	});

    	$$self.$inject_state = $$props => {
    		if ("onBurgerClick" in $$props) $$invalidate(0, onBurgerClick = $$props.onBurgerClick);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [onBurgerClick, $time, formatter];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$f, create_fragment$f, safe_not_equal, { onBurgerClick: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment$f.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*onBurgerClick*/ ctx[0] === undefined && !("onBurgerClick" in props)) {
    			console.warn("<Header> was created without expected prop 'onBurgerClick'");
    		}
    	}

    	get onBurgerClick() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onBurgerClick(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var css_248z$a = "";
    styleInject(css_248z$a);

    /* src/Comps/startmessage.svelte generated by Svelte v3.38.3 */
    const file$e = "src/Comps/startmessage.svelte";

    // (13:0) {#if !$sched_data_loaded}
    function create_if_block$7(ctx) {
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;
    	const if_block_creators = [create_if_block_1$5, create_if_block_2$3, create_else_block$2];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$load_ini_data*/ ctx[2]) return 0;
    		if (/*$err_ini_data*/ ctx[3]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			attr_dev(div, "class", "start-message svelte-8fn287");
    			add_location(div, file$e, 13, 4, 385);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
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
    			if (detaching) detach_dev(div);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(13:0) {#if !$sched_data_loaded}",
    		ctx
    	});

    	return block;
    }

    // (24:8) {:else}
    function create_else_block$2(ctx) {
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let t4;
    	let button;
    	let div2_transition;
    	let current;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Расписание";
    			t1 = space();
    			div1 = element("div");
    			div1.textContent = `на ${/*date*/ ctx[4].toLocaleDateString("ru-RU", /*date_opts*/ ctx[5])}`;
    			t4 = space();
    			button = element("button");
    			button.textContent = "Выберите преподавателя";
    			add_location(div0, file$e, 25, 16, 778);
    			add_location(div1, file$e, 26, 16, 816);
    			attr_dev(button, "class", "button select-tchr svelte-8fn287");
    			add_location(button, file$e, 30, 16, 931);
    			attr_dev(div2, "class", "start-info svelte-8fn287");
    			add_location(div2, file$e, 24, 12, 721);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div2, t4);
    			append_dev(div2, button);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(
    					button,
    					"click",
    					function () {
    						if (is_function(/*openDrawer*/ ctx[0])) /*openDrawer*/ ctx[0].apply(this, arguments);
    					},
    					false,
    					false,
    					false
    				);

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, true);
    				div2_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (!div2_transition) div2_transition = create_bidirectional_transition(div2, fade, {}, false);
    			div2_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (detaching && div2_transition) div2_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(24:8) {:else}",
    		ctx
    	});

    	return block;
    }

    // (17:32) 
    function create_if_block_2$3(ctx) {
    	let div;
    	let p0;
    	let t1;
    	let p1;
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			p0.textContent = "Произошла ошибка";
    			t1 = space();
    			p1 = element("p");
    			t2 = text(/*$err_ini_data*/ ctx[3]);
    			add_location(p0, file$e, 18, 16, 573);
    			add_location(p1, file$e, 19, 16, 613);
    			add_location(div, file$e, 17, 12, 551);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(div, t1);
    			append_dev(div, p1);
    			append_dev(p1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$err_ini_data*/ 8) set_data_dev(t2, /*$err_ini_data*/ ctx[3]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$3.name,
    		type: "if",
    		source: "(17:32) ",
    		ctx
    	});

    	return block;
    }

    // (15:8) {#if $load_ini_data}
    function create_if_block_1$5(ctx) {
    	let fa;
    	let current;

    	fa = new Fa({
    			props: {
    				icon: faSpinner,
    				size: "3x",
    				spin: true,
    				color: "blue"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(fa.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(fa, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(fa, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$5.name,
    		type: "if",
    		source: "(15:8) {#if $load_ini_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$e(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = !/*$sched_data_loaded*/ ctx[1] && create_if_block$7(ctx);

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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (!/*$sched_data_loaded*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$sched_data_loaded*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$7(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$e.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$e($$self, $$props, $$invalidate) {
    	let $sched_data_loaded;
    	let $load_ini_data;
    	let $err_ini_data;
    	validate_store(sched_data_loaded, "sched_data_loaded");
    	component_subscribe($$self, sched_data_loaded, $$value => $$invalidate(1, $sched_data_loaded = $$value));
    	validate_store(load_ini_data, "load_ini_data");
    	component_subscribe($$self, load_ini_data, $$value => $$invalidate(2, $load_ini_data = $$value));
    	validate_store(err_ini_data, "err_ini_data");
    	component_subscribe($$self, err_ini_data, $$value => $$invalidate(3, $err_ini_data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Startmessage", slots, []);
    	let { openDrawer } = $$props;
    	let date = new Date();
    	let date_opts = { year: "numeric", month: "long" };
    	const writable_props = ["openDrawer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Startmessage> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("openDrawer" in $$props) $$invalidate(0, openDrawer = $$props.openDrawer);
    	};

    	$$self.$capture_state = () => ({
    		load_ini_data,
    		err_ini_data,
    		sched_data_loaded,
    		fade,
    		Fa,
    		faSpinner,
    		openDrawer,
    		date,
    		date_opts,
    		$sched_data_loaded,
    		$load_ini_data,
    		$err_ini_data
    	});

    	$$self.$inject_state = $$props => {
    		if ("openDrawer" in $$props) $$invalidate(0, openDrawer = $$props.openDrawer);
    		if ("date" in $$props) $$invalidate(4, date = $$props.date);
    		if ("date_opts" in $$props) $$invalidate(5, date_opts = $$props.date_opts);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [openDrawer, $sched_data_loaded, $load_ini_data, $err_ini_data, date, date_opts];
    }

    class Startmessage extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$e, create_fragment$e, safe_not_equal, { openDrawer: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Startmessage",
    			options,
    			id: create_fragment$e.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*openDrawer*/ ctx[0] === undefined && !("openDrawer" in props)) {
    			console.warn("<Startmessage> was created without expected prop 'openDrawer'");
    		}
    	}

    	get openDrawer() {
    		throw new Error("<Startmessage>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set openDrawer(value) {
    		throw new Error("<Startmessage>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function toInteger(dirtyNumber) {
      if (dirtyNumber === null || dirtyNumber === true || dirtyNumber === false) {
        return NaN;
      }

      var number = Number(dirtyNumber);

      if (isNaN(number)) {
        return number;
      }

      return number < 0 ? Math.ceil(number) : Math.floor(number);
    }

    function requiredArgs(required, args) {
      if (args.length < required) {
        throw new TypeError(required + ' argument' + (required > 1 ? 's' : '') + ' required, but only ' + args.length + ' present');
      }
    }

    /**
     * @name toDate
     * @category Common Helpers
     * @summary Convert the given argument to an instance of Date.
     *
     * @description
     * Convert the given argument to an instance of Date.
     *
     * If the argument is an instance of Date, the function returns its clone.
     *
     * If the argument is a number, it is treated as a timestamp.
     *
     * If the argument is none of the above, the function returns Invalid Date.
     *
     * **Note**: *all* Date arguments passed to any *date-fns* function is processed by `toDate`.
     *
     * @param {Date|Number} argument - the value to convert
     * @returns {Date} the parsed date in the local time zone
     * @throws {TypeError} 1 argument required
     *
     * @example
     * // Clone the date:
     * const result = toDate(new Date(2014, 1, 11, 11, 30, 30))
     * //=> Tue Feb 11 2014 11:30:30
     *
     * @example
     * // Convert the timestamp to date:
     * const result = toDate(1392098430000)
     * //=> Tue Feb 11 2014 11:30:30
     */

    function toDate(argument) {
      requiredArgs(1, arguments);
      var argStr = Object.prototype.toString.call(argument); // Clone the date

      if (argument instanceof Date || typeof argument === 'object' && argStr === '[object Date]') {
        // Prevent the date to lose the milliseconds when passed to new Date() in IE10
        return new Date(argument.getTime());
      } else if (typeof argument === 'number' || argStr === '[object Number]') {
        return new Date(argument);
      } else {
        if ((typeof argument === 'string' || argStr === '[object String]') && typeof console !== 'undefined') {
          // eslint-disable-next-line no-console
          console.warn("Starting with v2.0.0-beta.1 date-fns doesn't accept strings as date arguments. Please use `parseISO` to parse strings. See: https://git.io/fjule"); // eslint-disable-next-line no-console

          console.warn(new Error().stack);
        }

        return new Date(NaN);
      }
    }

    /**
     * @name addDays
     * @category Day Helpers
     * @summary Add the specified number of days to the given date.
     *
     * @description
     * Add the specified number of days to the given date.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Number} amount - the amount of days to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     * @returns {Date} - the new date with the days added
     * @throws {TypeError} - 2 arguments required
     *
     * @example
     * // Add 10 days to 1 September 2014:
     * const result = addDays(new Date(2014, 8, 1), 10)
     * //=> Thu Sep 11 2014 00:00:00
     */

    function addDays(dirtyDate, dirtyAmount) {
      requiredArgs(2, arguments);
      var date = toDate(dirtyDate);
      var amount = toInteger(dirtyAmount);

      if (isNaN(amount)) {
        return new Date(NaN);
      }

      if (!amount) {
        // If 0 days, no-op to avoid changing times in the hour before end of DST
        return date;
      }

      date.setDate(date.getDate() + amount);
      return date;
    }

    /**
     * @name addMonths
     * @category Month Helpers
     * @summary Add the specified number of months to the given date.
     *
     * @description
     * Add the specified number of months to the given date.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Number} amount - the amount of months to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     * @returns {Date} the new date with the months added
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Add 5 months to 1 September 2014:
     * const result = addMonths(new Date(2014, 8, 1), 5)
     * //=> Sun Feb 01 2015 00:00:00
     */

    function addMonths(dirtyDate, dirtyAmount) {
      requiredArgs(2, arguments);
      var date = toDate(dirtyDate);
      var amount = toInteger(dirtyAmount);

      if (isNaN(amount)) {
        return new Date(NaN);
      }

      if (!amount) {
        // If 0 months, no-op to avoid changing times in the hour before end of DST
        return date;
      }

      var dayOfMonth = date.getDate(); // The JS Date object supports date math by accepting out-of-bounds values for
      // month, day, etc. For example, new Date(2020, 0, 0) returns 31 Dec 2019 and
      // new Date(2020, 13, 1) returns 1 Feb 2021.  This is *almost* the behavior we
      // want except that dates will wrap around the end of a month, meaning that
      // new Date(2020, 13, 31) will return 3 Mar 2021 not 28 Feb 2021 as desired. So
      // we'll default to the end of the desired month by adding 1 to the desired
      // month and using a date of 0 to back up one day to the end of the desired
      // month.

      var endOfDesiredMonth = new Date(date.getTime());
      endOfDesiredMonth.setMonth(date.getMonth() + amount + 1, 0);
      var daysInMonth = endOfDesiredMonth.getDate();

      if (dayOfMonth >= daysInMonth) {
        // If we're already at the end of the month, then this is the correct date
        // and we're done.
        return endOfDesiredMonth;
      } else {
        // Otherwise, we now know that setting the original day-of-month value won't
        // cause an overflow, so set the desired day-of-month. Note that we can't
        // just set the date of `endOfDesiredMonth` because that object may have had
        // its time changed in the unusual case where where a DST transition was on
        // the last day of the month and its local time was in the hour skipped or
        // repeated next to a DST transition.  So we use `date` instead which is
        // guaranteed to still have the original time.
        date.setFullYear(endOfDesiredMonth.getFullYear(), endOfDesiredMonth.getMonth(), dayOfMonth);
        return date;
      }
    }

    /**
     * @name add
     * @category Common Helpers
     * @summary Add the specified years, months, weeks, days, hours, minutes and seconds to the given date.
     *
     * @description
     * Add the specified years, months, weeks, days, hours, minutes and seconds to the given date.
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Duration} duration - the object with years, months, weeks, days, hours, minutes and seconds to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     *
     * | Key            | Description                        |
     * |----------------|------------------------------------|
     * | years          | Amount of years to be added        |
     * | months         | Amount of months to be added       |
     * | weeks          | Amount of weeks to be added        |
     * | days           | Amount of days to be added         |
     * | hours          | Amount of hours to be added        |
     * | minutes        | Amount of minutes to be added      |
     * | seconds        | Amount of seconds to be added      |
     *
     * All values default to 0
     *
     * @returns {Date} the new date with the seconds added
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Add the following duration to 1 September 2014, 10:19:50
     * const result = add(new Date(2014, 8, 1, 10, 19, 50), {
     *   years: 2,
     *   months: 9,
     *   weeks: 1,
     *   days: 7,
     *   hours: 5,
     *   minutes: 9,
     *   seconds: 30,
     * })
     * //=> Thu Jun 15 2017 15:29:20
     */
    function add(dirtyDate, duration) {
      requiredArgs(2, arguments);
      if (!duration || typeof duration !== 'object') return new Date(NaN);
      var years = duration.years ? toInteger(duration.years) : 0;
      var months = duration.months ? toInteger(duration.months) : 0;
      var weeks = duration.weeks ? toInteger(duration.weeks) : 0;
      var days = duration.days ? toInteger(duration.days) : 0;
      var hours = duration.hours ? toInteger(duration.hours) : 0;
      var minutes = duration.minutes ? toInteger(duration.minutes) : 0;
      var seconds = duration.seconds ? toInteger(duration.seconds) : 0; // Add years and months

      var date = toDate(dirtyDate);
      var dateWithMonths = months || years ? addMonths(date, months + years * 12) : date; // Add weeks and days

      var dateWithDays = days || weeks ? addDays(dateWithMonths, days + weeks * 7) : dateWithMonths; // Add days, hours, minutes and seconds

      var minutesToAdd = minutes + hours * 60;
      var secondsToAdd = seconds + minutesToAdd * 60;
      var msToAdd = secondsToAdd * 1000;
      var finalDate = new Date(dateWithDays.getTime() + msToAdd);
      return finalDate;
    }

    /**
     * @name addMilliseconds
     * @category Millisecond Helpers
     * @summary Add the specified number of milliseconds to the given date.
     *
     * @description
     * Add the specified number of milliseconds to the given date.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Number} amount - the amount of milliseconds to be added. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     * @returns {Date} the new date with the milliseconds added
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Add 750 milliseconds to 10 July 2014 12:45:30.000:
     * const result = addMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
     * //=> Thu Jul 10 2014 12:45:30.750
     */

    function addMilliseconds(dirtyDate, dirtyAmount) {
      requiredArgs(2, arguments);
      var timestamp = toDate(dirtyDate).getTime();
      var amount = toInteger(dirtyAmount);
      return new Date(timestamp + amount);
    }

    /**
     * Google Chrome as of 67.0.3396.87 introduced timezones with offset that includes seconds.
     * They usually appear for dates that denote time before the timezones were introduced
     * (e.g. for 'Europe/Prague' timezone the offset is GMT+00:57:44 before 1 October 1891
     * and GMT+01:00:00 after that date)
     *
     * Date#getTimezoneOffset returns the offset in minutes and would return 57 for the example above,
     * which would lead to incorrect calculations.
     *
     * This function returns the timezone offset in milliseconds that takes seconds in account.
     */
    function getTimezoneOffsetInMilliseconds(date) {
      var utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds(), date.getMilliseconds()));
      utcDate.setUTCFullYear(date.getFullYear());
      return date.getTime() - utcDate.getTime();
    }

    /**
     * @name isDate
     * @category Common Helpers
     * @summary Is the given value a date?
     *
     * @description
     * Returns true if the given value is an instance of Date. The function works for dates transferred across iframes.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {*} value - the value to check
     * @returns {boolean} true if the given value is a date
     * @throws {TypeError} 1 arguments required
     *
     * @example
     * // For a valid date:
     * const result = isDate(new Date())
     * //=> true
     *
     * @example
     * // For an invalid date:
     * const result = isDate(new Date(NaN))
     * //=> true
     *
     * @example
     * // For some value:
     * const result = isDate('2014-02-31')
     * //=> false
     *
     * @example
     * // For an object:
     * const result = isDate({})
     * //=> false
     */

    function isDate(value) {
      requiredArgs(1, arguments);
      return value instanceof Date || typeof value === 'object' && Object.prototype.toString.call(value) === '[object Date]';
    }

    /**
     * @name isValid
     * @category Common Helpers
     * @summary Is the given date valid?
     *
     * @description
     * Returns false if argument is Invalid Date and true otherwise.
     * Argument is converted to Date using `toDate`. See [toDate]{@link https://date-fns.org/docs/toDate}
     * Invalid Date is a Date, whose time value is NaN.
     *
     * Time value of Date: http://es5.github.io/#x15.9.1.1
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * - Now `isValid` doesn't throw an exception
     *   if the first argument is not an instance of Date.
     *   Instead, argument is converted beforehand using `toDate`.
     *
     *   Examples:
     *
     *   | `isValid` argument        | Before v2.0.0 | v2.0.0 onward |
     *   |---------------------------|---------------|---------------|
     *   | `new Date()`              | `true`        | `true`        |
     *   | `new Date('2016-01-01')`  | `true`        | `true`        |
     *   | `new Date('')`            | `false`       | `false`       |
     *   | `new Date(1488370835081)` | `true`        | `true`        |
     *   | `new Date(NaN)`           | `false`       | `false`       |
     *   | `'2016-01-01'`            | `TypeError`   | `false`       |
     *   | `''`                      | `TypeError`   | `false`       |
     *   | `1488370835081`           | `TypeError`   | `true`        |
     *   | `NaN`                     | `TypeError`   | `false`       |
     *
     *   We introduce this change to make *date-fns* consistent with ECMAScript behavior
     *   that try to coerce arguments to the expected type
     *   (which is also the case with other *date-fns* functions).
     *
     * @param {*} date - the date to check
     * @returns {Boolean} the date is valid
     * @throws {TypeError} 1 argument required
     *
     * @example
     * // For the valid date:
     * const result = isValid(new Date(2014, 1, 31))
     * //=> true
     *
     * @example
     * // For the value, convertable into a date:
     * const result = isValid(1393804800000)
     * //=> true
     *
     * @example
     * // For the invalid date:
     * const result = isValid(new Date(''))
     * //=> false
     */

    function isValid(dirtyDate) {
      requiredArgs(1, arguments);

      if (!isDate(dirtyDate) && typeof dirtyDate !== 'number') {
        return false;
      }

      var date = toDate(dirtyDate);
      return !isNaN(Number(date));
    }

    var formatDistanceLocale$1 = {
      lessThanXSeconds: {
        one: 'less than a second',
        other: 'less than {{count}} seconds'
      },
      xSeconds: {
        one: '1 second',
        other: '{{count}} seconds'
      },
      halfAMinute: 'half a minute',
      lessThanXMinutes: {
        one: 'less than a minute',
        other: 'less than {{count}} minutes'
      },
      xMinutes: {
        one: '1 minute',
        other: '{{count}} minutes'
      },
      aboutXHours: {
        one: 'about 1 hour',
        other: 'about {{count}} hours'
      },
      xHours: {
        one: '1 hour',
        other: '{{count}} hours'
      },
      xDays: {
        one: '1 day',
        other: '{{count}} days'
      },
      aboutXWeeks: {
        one: 'about 1 week',
        other: 'about {{count}} weeks'
      },
      xWeeks: {
        one: '1 week',
        other: '{{count}} weeks'
      },
      aboutXMonths: {
        one: 'about 1 month',
        other: 'about {{count}} months'
      },
      xMonths: {
        one: '1 month',
        other: '{{count}} months'
      },
      aboutXYears: {
        one: 'about 1 year',
        other: 'about {{count}} years'
      },
      xYears: {
        one: '1 year',
        other: '{{count}} years'
      },
      overXYears: {
        one: 'over 1 year',
        other: 'over {{count}} years'
      },
      almostXYears: {
        one: 'almost 1 year',
        other: 'almost {{count}} years'
      }
    };

    var formatDistance$1 = function (token, count, options) {
      var result;
      var tokenValue = formatDistanceLocale$1[token];

      if (typeof tokenValue === 'string') {
        result = tokenValue;
      } else if (count === 1) {
        result = tokenValue.one;
      } else {
        result = tokenValue.other.replace('{{count}}', count.toString());
      }

      if (options !== null && options !== void 0 && options.addSuffix) {
        if (options.comparison && options.comparison > 0) {
          return 'in ' + result;
        } else {
          return result + ' ago';
        }
      }

      return result;
    };

    function buildFormatLongFn(args) {
      return function () {
        var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
        // TODO: Remove String()
        var width = options.width ? String(options.width) : args.defaultWidth;
        var format = args.formats[width] || args.formats[args.defaultWidth];
        return format;
      };
    }

    var dateFormats$1 = {
      full: 'EEEE, MMMM do, y',
      long: 'MMMM do, y',
      medium: 'MMM d, y',
      short: 'MM/dd/yyyy'
    };
    var timeFormats$1 = {
      full: 'h:mm:ss a zzzz',
      long: 'h:mm:ss a z',
      medium: 'h:mm:ss a',
      short: 'h:mm a'
    };
    var dateTimeFormats$1 = {
      full: "{{date}} 'at' {{time}}",
      long: "{{date}} 'at' {{time}}",
      medium: '{{date}}, {{time}}',
      short: '{{date}}, {{time}}'
    };
    var formatLong$1 = {
      date: buildFormatLongFn({
        formats: dateFormats$1,
        defaultWidth: 'full'
      }),
      time: buildFormatLongFn({
        formats: timeFormats$1,
        defaultWidth: 'full'
      }),
      dateTime: buildFormatLongFn({
        formats: dateTimeFormats$1,
        defaultWidth: 'full'
      })
    };

    var formatRelativeLocale$1 = {
      lastWeek: "'last' eeee 'at' p",
      yesterday: "'yesterday at' p",
      today: "'today at' p",
      tomorrow: "'tomorrow at' p",
      nextWeek: "eeee 'at' p",
      other: 'P'
    };

    var formatRelative$1 = function (token, _date, _baseDate, _options) {
      return formatRelativeLocale$1[token];
    };

    function buildLocalizeFn(args) {
      return function (dirtyIndex, dirtyOptions) {
        var options = dirtyOptions || {};
        var context = options.context ? String(options.context) : 'standalone';
        var valuesArray;

        if (context === 'formatting' && args.formattingValues) {
          var defaultWidth = args.defaultFormattingWidth || args.defaultWidth;
          var width = options.width ? String(options.width) : defaultWidth;
          valuesArray = args.formattingValues[width] || args.formattingValues[defaultWidth];
        } else {
          var _defaultWidth = args.defaultWidth;

          var _width = options.width ? String(options.width) : args.defaultWidth;

          valuesArray = args.values[_width] || args.values[_defaultWidth];
        }

        var index = args.argumentCallback ? args.argumentCallback(dirtyIndex) : dirtyIndex; // @ts-ignore: For some reason TypeScript just don't want to match it, no matter how hard we try. I challenge you to try to remove it!

        return valuesArray[index];
      };
    }

    var eraValues$1 = {
      narrow: ['B', 'A'],
      abbreviated: ['BC', 'AD'],
      wide: ['Before Christ', 'Anno Domini']
    };
    var quarterValues$1 = {
      narrow: ['1', '2', '3', '4'],
      abbreviated: ['Q1', 'Q2', 'Q3', 'Q4'],
      wide: ['1st quarter', '2nd quarter', '3rd quarter', '4th quarter']
    }; // Note: in English, the names of days of the week and months are capitalized.
    // If you are making a new locale based on this one, check if the same is true for the language you're working on.
    // Generally, formatted dates should look like they are in the middle of a sentence,
    // e.g. in Spanish language the weekdays and months should be in the lowercase.

    var monthValues$1 = {
      narrow: ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      abbreviated: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      wide: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    };
    var dayValues$1 = {
      narrow: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
      short: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
      abbreviated: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      wide: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    };
    var dayPeriodValues$1 = {
      narrow: {
        am: 'a',
        pm: 'p',
        midnight: 'mi',
        noon: 'n',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      },
      abbreviated: {
        am: 'AM',
        pm: 'PM',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      },
      wide: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'morning',
        afternoon: 'afternoon',
        evening: 'evening',
        night: 'night'
      }
    };
    var formattingDayPeriodValues$1 = {
      narrow: {
        am: 'a',
        pm: 'p',
        midnight: 'mi',
        noon: 'n',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      },
      abbreviated: {
        am: 'AM',
        pm: 'PM',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      },
      wide: {
        am: 'a.m.',
        pm: 'p.m.',
        midnight: 'midnight',
        noon: 'noon',
        morning: 'in the morning',
        afternoon: 'in the afternoon',
        evening: 'in the evening',
        night: 'at night'
      }
    };

    var ordinalNumber$1 = function (dirtyNumber, _options) {
      var number = Number(dirtyNumber); // If ordinal numbers depend on context, for example,
      // if they are different for different grammatical genders,
      // use `options.unit`.
      //
      // `unit` can be 'year', 'quarter', 'month', 'week', 'date', 'dayOfYear',
      // 'day', 'hour', 'minute', 'second'.

      var rem100 = number % 100;

      if (rem100 > 20 || rem100 < 10) {
        switch (rem100 % 10) {
          case 1:
            return number + 'st';

          case 2:
            return number + 'nd';

          case 3:
            return number + 'rd';
        }
      }

      return number + 'th';
    };

    var localize$1 = {
      ordinalNumber: ordinalNumber$1,
      era: buildLocalizeFn({
        values: eraValues$1,
        defaultWidth: 'wide'
      }),
      quarter: buildLocalizeFn({
        values: quarterValues$1,
        defaultWidth: 'wide',
        argumentCallback: function (quarter) {
          return quarter - 1;
        }
      }),
      month: buildLocalizeFn({
        values: monthValues$1,
        defaultWidth: 'wide'
      }),
      day: buildLocalizeFn({
        values: dayValues$1,
        defaultWidth: 'wide'
      }),
      dayPeriod: buildLocalizeFn({
        values: dayPeriodValues$1,
        defaultWidth: 'wide',
        formattingValues: formattingDayPeriodValues$1,
        defaultFormattingWidth: 'wide'
      })
    };

    function buildMatchFn(args) {
      return function (string) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var width = options.width;
        var matchPattern = width && args.matchPatterns[width] || args.matchPatterns[args.defaultMatchWidth];
        var matchResult = string.match(matchPattern);

        if (!matchResult) {
          return null;
        }

        var matchedString = matchResult[0];
        var parsePatterns = width && args.parsePatterns[width] || args.parsePatterns[args.defaultParseWidth];
        var key = Array.isArray(parsePatterns) ? findIndex(parsePatterns, function (pattern) {
          return pattern.test(matchedString);
        }) : findKey(parsePatterns, function (pattern) {
          return pattern.test(matchedString);
        });
        var value;
        value = args.valueCallback ? args.valueCallback(key) : key;
        value = options.valueCallback ? options.valueCallback(value) : value;
        var rest = string.slice(matchedString.length);
        return {
          value: value,
          rest: rest
        };
      };
    }

    function findKey(object, predicate) {
      for (var key in object) {
        if (object.hasOwnProperty(key) && predicate(object[key])) {
          return key;
        }
      }

      return undefined;
    }

    function findIndex(array, predicate) {
      for (var key = 0; key < array.length; key++) {
        if (predicate(array[key])) {
          return key;
        }
      }

      return undefined;
    }

    function buildMatchPatternFn(args) {
      return function (string) {
        var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
        var matchResult = string.match(args.matchPattern);
        if (!matchResult) return null;
        var matchedString = matchResult[0];
        var parseResult = string.match(args.parsePattern);
        if (!parseResult) return null;
        var value = args.valueCallback ? args.valueCallback(parseResult[0]) : parseResult[0];
        value = options.valueCallback ? options.valueCallback(value) : value;
        var rest = string.slice(matchedString.length);
        return {
          value: value,
          rest: rest
        };
      };
    }

    var matchOrdinalNumberPattern$1 = /^(\d+)(th|st|nd|rd)?/i;
    var parseOrdinalNumberPattern$1 = /\d+/i;
    var matchEraPatterns$1 = {
      narrow: /^(b|a)/i,
      abbreviated: /^(b\.?\s?c\.?|b\.?\s?c\.?\s?e\.?|a\.?\s?d\.?|c\.?\s?e\.?)/i,
      wide: /^(before christ|before common era|anno domini|common era)/i
    };
    var parseEraPatterns$1 = {
      any: [/^b/i, /^(a|c)/i]
    };
    var matchQuarterPatterns$1 = {
      narrow: /^[1234]/i,
      abbreviated: /^q[1234]/i,
      wide: /^[1234](th|st|nd|rd)? quarter/i
    };
    var parseQuarterPatterns$1 = {
      any: [/1/i, /2/i, /3/i, /4/i]
    };
    var matchMonthPatterns$1 = {
      narrow: /^[jfmasond]/i,
      abbreviated: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
      wide: /^(january|february|march|april|may|june|july|august|september|october|november|december)/i
    };
    var parseMonthPatterns$1 = {
      narrow: [/^j/i, /^f/i, /^m/i, /^a/i, /^m/i, /^j/i, /^j/i, /^a/i, /^s/i, /^o/i, /^n/i, /^d/i],
      any: [/^ja/i, /^f/i, /^mar/i, /^ap/i, /^may/i, /^jun/i, /^jul/i, /^au/i, /^s/i, /^o/i, /^n/i, /^d/i]
    };
    var matchDayPatterns$1 = {
      narrow: /^[smtwf]/i,
      short: /^(su|mo|tu|we|th|fr|sa)/i,
      abbreviated: /^(sun|mon|tue|wed|thu|fri|sat)/i,
      wide: /^(sunday|monday|tuesday|wednesday|thursday|friday|saturday)/i
    };
    var parseDayPatterns$1 = {
      narrow: [/^s/i, /^m/i, /^t/i, /^w/i, /^t/i, /^f/i, /^s/i],
      any: [/^su/i, /^m/i, /^tu/i, /^w/i, /^th/i, /^f/i, /^sa/i]
    };
    var matchDayPeriodPatterns$1 = {
      narrow: /^(a|p|mi|n|(in the|at) (morning|afternoon|evening|night))/i,
      any: /^([ap]\.?\s?m\.?|midnight|noon|(in the|at) (morning|afternoon|evening|night))/i
    };
    var parseDayPeriodPatterns$1 = {
      any: {
        am: /^a/i,
        pm: /^p/i,
        midnight: /^mi/i,
        noon: /^no/i,
        morning: /morning/i,
        afternoon: /afternoon/i,
        evening: /evening/i,
        night: /night/i
      }
    };
    var match$1 = {
      ordinalNumber: buildMatchPatternFn({
        matchPattern: matchOrdinalNumberPattern$1,
        parsePattern: parseOrdinalNumberPattern$1,
        valueCallback: function (value) {
          return parseInt(value, 10);
        }
      }),
      era: buildMatchFn({
        matchPatterns: matchEraPatterns$1,
        defaultMatchWidth: 'wide',
        parsePatterns: parseEraPatterns$1,
        defaultParseWidth: 'any'
      }),
      quarter: buildMatchFn({
        matchPatterns: matchQuarterPatterns$1,
        defaultMatchWidth: 'wide',
        parsePatterns: parseQuarterPatterns$1,
        defaultParseWidth: 'any',
        valueCallback: function (index) {
          return index + 1;
        }
      }),
      month: buildMatchFn({
        matchPatterns: matchMonthPatterns$1,
        defaultMatchWidth: 'wide',
        parsePatterns: parseMonthPatterns$1,
        defaultParseWidth: 'any'
      }),
      day: buildMatchFn({
        matchPatterns: matchDayPatterns$1,
        defaultMatchWidth: 'wide',
        parsePatterns: parseDayPatterns$1,
        defaultParseWidth: 'any'
      }),
      dayPeriod: buildMatchFn({
        matchPatterns: matchDayPeriodPatterns$1,
        defaultMatchWidth: 'any',
        parsePatterns: parseDayPeriodPatterns$1,
        defaultParseWidth: 'any'
      })
    };

    /**
     * @type {Locale}
     * @category Locales
     * @summary English locale (United States).
     * @language English
     * @iso-639-2 eng
     * @author Sasha Koss [@kossnocorp]{@link https://github.com/kossnocorp}
     * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
     */
    var locale$1 = {
      code: 'en-US',
      formatDistance: formatDistance$1,
      formatLong: formatLong$1,
      formatRelative: formatRelative$1,
      localize: localize$1,
      match: match$1,
      options: {
        weekStartsOn: 0
        /* Sunday */
        ,
        firstWeekContainsDate: 1
      }
    };

    /**
     * @name subMilliseconds
     * @category Millisecond Helpers
     * @summary Subtract the specified number of milliseconds from the given date.
     *
     * @description
     * Subtract the specified number of milliseconds from the given date.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the date to be changed
     * @param {Number} amount - the amount of milliseconds to be subtracted. Positive decimals will be rounded using `Math.floor`, decimals less than zero will be rounded using `Math.ceil`.
     * @returns {Date} the new date with the milliseconds subtracted
     * @throws {TypeError} 2 arguments required
     *
     * @example
     * // Subtract 750 milliseconds from 10 July 2014 12:45:30.000:
     * const result = subMilliseconds(new Date(2014, 6, 10, 12, 45, 30, 0), 750)
     * //=> Thu Jul 10 2014 12:45:29.250
     */

    function subMilliseconds(dirtyDate, dirtyAmount) {
      requiredArgs(2, arguments);
      var amount = toInteger(dirtyAmount);
      return addMilliseconds(dirtyDate, -amount);
    }

    var MILLISECONDS_IN_DAY = 86400000; // This function will be a part of public API when UTC function will be implemented.
    // See issue: https://github.com/date-fns/date-fns/issues/376

    function getUTCDayOfYear(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var timestamp = date.getTime();
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
      var startOfYearTimestamp = date.getTime();
      var difference = timestamp - startOfYearTimestamp;
      return Math.floor(difference / MILLISECONDS_IN_DAY) + 1;
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function startOfUTCISOWeek(dirtyDate) {
      requiredArgs(1, arguments);
      var weekStartsOn = 1;
      var date = toDate(dirtyDate);
      var day = date.getUTCDay();
      var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
      date.setUTCDate(date.getUTCDate() - diff);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function getUTCISOWeekYear(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var year = date.getUTCFullYear();
      var fourthOfJanuaryOfNextYear = new Date(0);
      fourthOfJanuaryOfNextYear.setUTCFullYear(year + 1, 0, 4);
      fourthOfJanuaryOfNextYear.setUTCHours(0, 0, 0, 0);
      var startOfNextYear = startOfUTCISOWeek(fourthOfJanuaryOfNextYear);
      var fourthOfJanuaryOfThisYear = new Date(0);
      fourthOfJanuaryOfThisYear.setUTCFullYear(year, 0, 4);
      fourthOfJanuaryOfThisYear.setUTCHours(0, 0, 0, 0);
      var startOfThisYear = startOfUTCISOWeek(fourthOfJanuaryOfThisYear);

      if (date.getTime() >= startOfNextYear.getTime()) {
        return year + 1;
      } else if (date.getTime() >= startOfThisYear.getTime()) {
        return year;
      } else {
        return year - 1;
      }
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function startOfUTCISOWeekYear(dirtyDate) {
      requiredArgs(1, arguments);
      var year = getUTCISOWeekYear(dirtyDate);
      var fourthOfJanuary = new Date(0);
      fourthOfJanuary.setUTCFullYear(year, 0, 4);
      fourthOfJanuary.setUTCHours(0, 0, 0, 0);
      var date = startOfUTCISOWeek(fourthOfJanuary);
      return date;
    }

    var MILLISECONDS_IN_WEEK$1 = 604800000; // This function will be a part of public API when UTC function will be implemented.
    // See issue: https://github.com/date-fns/date-fns/issues/376

    function getUTCISOWeek(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var diff = startOfUTCISOWeek(date).getTime() - startOfUTCISOWeekYear(date).getTime(); // Round the number of days to the nearest integer
      // because the number of milliseconds in a week is not constant
      // (e.g. it's different in the week of the daylight saving time clock shift)

      return Math.round(diff / MILLISECONDS_IN_WEEK$1) + 1;
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function startOfUTCWeek(dirtyDate, dirtyOptions) {
      requiredArgs(1, arguments);
      var options = dirtyOptions || {};
      var locale = options.locale;
      var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
      var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
      var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

      if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
        throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
      }

      var date = toDate(dirtyDate);
      var day = date.getUTCDay();
      var diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
      date.setUTCDate(date.getUTCDate() - diff);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function getUTCWeekYear(dirtyDate, dirtyOptions) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var year = date.getUTCFullYear();
      var options = dirtyOptions || {};
      var locale = options.locale;
      var localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
      var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
      var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate); // Test if weekStartsOn is between 1 and 7 _and_ is not NaN

      if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
        throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
      }

      var firstWeekOfNextYear = new Date(0);
      firstWeekOfNextYear.setUTCFullYear(year + 1, 0, firstWeekContainsDate);
      firstWeekOfNextYear.setUTCHours(0, 0, 0, 0);
      var startOfNextYear = startOfUTCWeek(firstWeekOfNextYear, dirtyOptions);
      var firstWeekOfThisYear = new Date(0);
      firstWeekOfThisYear.setUTCFullYear(year, 0, firstWeekContainsDate);
      firstWeekOfThisYear.setUTCHours(0, 0, 0, 0);
      var startOfThisYear = startOfUTCWeek(firstWeekOfThisYear, dirtyOptions);

      if (date.getTime() >= startOfNextYear.getTime()) {
        return year + 1;
      } else if (date.getTime() >= startOfThisYear.getTime()) {
        return year;
      } else {
        return year - 1;
      }
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function startOfUTCWeekYear(dirtyDate, dirtyOptions) {
      requiredArgs(1, arguments);
      var options = dirtyOptions || {};
      var locale = options.locale;
      var localeFirstWeekContainsDate = locale && locale.options && locale.options.firstWeekContainsDate;
      var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
      var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate);
      var year = getUTCWeekYear(dirtyDate, dirtyOptions);
      var firstWeek = new Date(0);
      firstWeek.setUTCFullYear(year, 0, firstWeekContainsDate);
      firstWeek.setUTCHours(0, 0, 0, 0);
      var date = startOfUTCWeek(firstWeek, dirtyOptions);
      return date;
    }

    var MILLISECONDS_IN_WEEK = 604800000; // This function will be a part of public API when UTC function will be implemented.
    // See issue: https://github.com/date-fns/date-fns/issues/376

    function getUTCWeek(dirtyDate, options) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var diff = startOfUTCWeek(date, options).getTime() - startOfUTCWeekYear(date, options).getTime(); // Round the number of days to the nearest integer
      // because the number of milliseconds in a week is not constant
      // (e.g. it's different in the week of the daylight saving time clock shift)

      return Math.round(diff / MILLISECONDS_IN_WEEK) + 1;
    }

    function addLeadingZeros(number, targetLength) {
      var sign = number < 0 ? '-' : '';
      var output = Math.abs(number).toString();

      while (output.length < targetLength) {
        output = '0' + output;
      }

      return sign + output;
    }

    /*
     * |     | Unit                           |     | Unit                           |
     * |-----|--------------------------------|-----|--------------------------------|
     * |  a  | AM, PM                         |  A* |                                |
     * |  d  | Day of month                   |  D  |                                |
     * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
     * |  m  | Minute                         |  M  | Month                          |
     * |  s  | Second                         |  S  | Fraction of second             |
     * |  y  | Year (abs)                     |  Y  |                                |
     *
     * Letters marked by * are not implemented but reserved by Unicode standard.
     */

    var formatters$1 = {
      // Year
      y: function (date, token) {
        // From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_tokens
        // | Year     |     y | yy |   yyy |  yyyy | yyyyy |
        // |----------|-------|----|-------|-------|-------|
        // | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
        // | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
        // | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
        // | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
        // | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |
        var signedYear = date.getUTCFullYear(); // Returns 1 for 1 BC (which is year 0 in JavaScript)

        var year = signedYear > 0 ? signedYear : 1 - signedYear;
        return addLeadingZeros(token === 'yy' ? year % 100 : year, token.length);
      },
      // Month
      M: function (date, token) {
        var month = date.getUTCMonth();
        return token === 'M' ? String(month + 1) : addLeadingZeros(month + 1, 2);
      },
      // Day of the month
      d: function (date, token) {
        return addLeadingZeros(date.getUTCDate(), token.length);
      },
      // AM or PM
      a: function (date, token) {
        var dayPeriodEnumValue = date.getUTCHours() / 12 >= 1 ? 'pm' : 'am';

        switch (token) {
          case 'a':
          case 'aa':
            return dayPeriodEnumValue.toUpperCase();

          case 'aaa':
            return dayPeriodEnumValue;

          case 'aaaaa':
            return dayPeriodEnumValue[0];

          case 'aaaa':
          default:
            return dayPeriodEnumValue === 'am' ? 'a.m.' : 'p.m.';
        }
      },
      // Hour [1-12]
      h: function (date, token) {
        return addLeadingZeros(date.getUTCHours() % 12 || 12, token.length);
      },
      // Hour [0-23]
      H: function (date, token) {
        return addLeadingZeros(date.getUTCHours(), token.length);
      },
      // Minute
      m: function (date, token) {
        return addLeadingZeros(date.getUTCMinutes(), token.length);
      },
      // Second
      s: function (date, token) {
        return addLeadingZeros(date.getUTCSeconds(), token.length);
      },
      // Fraction of second
      S: function (date, token) {
        var numberOfDigits = token.length;
        var milliseconds = date.getUTCMilliseconds();
        var fractionalSeconds = Math.floor(milliseconds * Math.pow(10, numberOfDigits - 3));
        return addLeadingZeros(fractionalSeconds, token.length);
      }
    };

    var dayPeriodEnum = {
      am: 'am',
      pm: 'pm',
      midnight: 'midnight',
      noon: 'noon',
      morning: 'morning',
      afternoon: 'afternoon',
      evening: 'evening',
      night: 'night'
    };
    /*
     * |     | Unit                           |     | Unit                           |
     * |-----|--------------------------------|-----|--------------------------------|
     * |  a  | AM, PM                         |  A* | Milliseconds in day            |
     * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
     * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
     * |  d  | Day of month                   |  D  | Day of year                    |
     * |  e  | Local day of week              |  E  | Day of week                    |
     * |  f  |                                |  F* | Day of week in month           |
     * |  g* | Modified Julian day            |  G  | Era                            |
     * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
     * |  i! | ISO day of week                |  I! | ISO week of year               |
     * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
     * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
     * |  l* | (deprecated)                   |  L  | Stand-alone month              |
     * |  m  | Minute                         |  M  | Month                          |
     * |  n  |                                |  N  |                                |
     * |  o! | Ordinal number modifier        |  O  | Timezone (GMT)                 |
     * |  p! | Long localized time            |  P! | Long localized date            |
     * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
     * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
     * |  s  | Second                         |  S  | Fraction of second             |
     * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
     * |  u  | Extended year                  |  U* | Cyclic year                    |
     * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
     * |  w  | Local week of year             |  W* | Week of month                  |
     * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
     * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
     * |  z  | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
     *
     * Letters marked by * are not implemented but reserved by Unicode standard.
     *
     * Letters marked by ! are non-standard, but implemented by date-fns:
     * - `o` modifies the previous token to turn it into an ordinal (see `format` docs)
     * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
     *   i.e. 7 for Sunday, 1 for Monday, etc.
     * - `I` is ISO week of year, as opposed to `w` which is local week of year.
     * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
     *   `R` is supposed to be used in conjunction with `I` and `i`
     *   for universal ISO week-numbering date, whereas
     *   `Y` is supposed to be used in conjunction with `w` and `e`
     *   for week-numbering date specific to the locale.
     * - `P` is long localized date format
     * - `p` is long localized time format
     */

    var formatters = {
      // Era
      G: function (date, token, localize) {
        var era = date.getUTCFullYear() > 0 ? 1 : 0;

        switch (token) {
          // AD, BC
          case 'G':
          case 'GG':
          case 'GGG':
            return localize.era(era, {
              width: 'abbreviated'
            });
          // A, B

          case 'GGGGG':
            return localize.era(era, {
              width: 'narrow'
            });
          // Anno Domini, Before Christ

          case 'GGGG':
          default:
            return localize.era(era, {
              width: 'wide'
            });
        }
      },
      // Year
      y: function (date, token, localize) {
        // Ordinal number
        if (token === 'yo') {
          var signedYear = date.getUTCFullYear(); // Returns 1 for 1 BC (which is year 0 in JavaScript)

          var year = signedYear > 0 ? signedYear : 1 - signedYear;
          return localize.ordinalNumber(year, {
            unit: 'year'
          });
        }

        return formatters$1.y(date, token);
      },
      // Local week-numbering year
      Y: function (date, token, localize, options) {
        var signedWeekYear = getUTCWeekYear(date, options); // Returns 1 for 1 BC (which is year 0 in JavaScript)

        var weekYear = signedWeekYear > 0 ? signedWeekYear : 1 - signedWeekYear; // Two digit year

        if (token === 'YY') {
          var twoDigitYear = weekYear % 100;
          return addLeadingZeros(twoDigitYear, 2);
        } // Ordinal number


        if (token === 'Yo') {
          return localize.ordinalNumber(weekYear, {
            unit: 'year'
          });
        } // Padding


        return addLeadingZeros(weekYear, token.length);
      },
      // ISO week-numbering year
      R: function (date, token) {
        var isoWeekYear = getUTCISOWeekYear(date); // Padding

        return addLeadingZeros(isoWeekYear, token.length);
      },
      // Extended year. This is a single number designating the year of this calendar system.
      // The main difference between `y` and `u` localizers are B.C. years:
      // | Year | `y` | `u` |
      // |------|-----|-----|
      // | AC 1 |   1 |   1 |
      // | BC 1 |   1 |   0 |
      // | BC 2 |   2 |  -1 |
      // Also `yy` always returns the last two digits of a year,
      // while `uu` pads single digit years to 2 characters and returns other years unchanged.
      u: function (date, token) {
        var year = date.getUTCFullYear();
        return addLeadingZeros(year, token.length);
      },
      // Quarter
      Q: function (date, token, localize) {
        var quarter = Math.ceil((date.getUTCMonth() + 1) / 3);

        switch (token) {
          // 1, 2, 3, 4
          case 'Q':
            return String(quarter);
          // 01, 02, 03, 04

          case 'QQ':
            return addLeadingZeros(quarter, 2);
          // 1st, 2nd, 3rd, 4th

          case 'Qo':
            return localize.ordinalNumber(quarter, {
              unit: 'quarter'
            });
          // Q1, Q2, Q3, Q4

          case 'QQQ':
            return localize.quarter(quarter, {
              width: 'abbreviated',
              context: 'formatting'
            });
          // 1, 2, 3, 4 (narrow quarter; could be not numerical)

          case 'QQQQQ':
            return localize.quarter(quarter, {
              width: 'narrow',
              context: 'formatting'
            });
          // 1st quarter, 2nd quarter, ...

          case 'QQQQ':
          default:
            return localize.quarter(quarter, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // Stand-alone quarter
      q: function (date, token, localize) {
        var quarter = Math.ceil((date.getUTCMonth() + 1) / 3);

        switch (token) {
          // 1, 2, 3, 4
          case 'q':
            return String(quarter);
          // 01, 02, 03, 04

          case 'qq':
            return addLeadingZeros(quarter, 2);
          // 1st, 2nd, 3rd, 4th

          case 'qo':
            return localize.ordinalNumber(quarter, {
              unit: 'quarter'
            });
          // Q1, Q2, Q3, Q4

          case 'qqq':
            return localize.quarter(quarter, {
              width: 'abbreviated',
              context: 'standalone'
            });
          // 1, 2, 3, 4 (narrow quarter; could be not numerical)

          case 'qqqqq':
            return localize.quarter(quarter, {
              width: 'narrow',
              context: 'standalone'
            });
          // 1st quarter, 2nd quarter, ...

          case 'qqqq':
          default:
            return localize.quarter(quarter, {
              width: 'wide',
              context: 'standalone'
            });
        }
      },
      // Month
      M: function (date, token, localize) {
        var month = date.getUTCMonth();

        switch (token) {
          case 'M':
          case 'MM':
            return formatters$1.M(date, token);
          // 1st, 2nd, ..., 12th

          case 'Mo':
            return localize.ordinalNumber(month + 1, {
              unit: 'month'
            });
          // Jan, Feb, ..., Dec

          case 'MMM':
            return localize.month(month, {
              width: 'abbreviated',
              context: 'formatting'
            });
          // J, F, ..., D

          case 'MMMMM':
            return localize.month(month, {
              width: 'narrow',
              context: 'formatting'
            });
          // January, February, ..., December

          case 'MMMM':
          default:
            return localize.month(month, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // Stand-alone month
      L: function (date, token, localize) {
        var month = date.getUTCMonth();

        switch (token) {
          // 1, 2, ..., 12
          case 'L':
            return String(month + 1);
          // 01, 02, ..., 12

          case 'LL':
            return addLeadingZeros(month + 1, 2);
          // 1st, 2nd, ..., 12th

          case 'Lo':
            return localize.ordinalNumber(month + 1, {
              unit: 'month'
            });
          // Jan, Feb, ..., Dec

          case 'LLL':
            return localize.month(month, {
              width: 'abbreviated',
              context: 'standalone'
            });
          // J, F, ..., D

          case 'LLLLL':
            return localize.month(month, {
              width: 'narrow',
              context: 'standalone'
            });
          // January, February, ..., December

          case 'LLLL':
          default:
            return localize.month(month, {
              width: 'wide',
              context: 'standalone'
            });
        }
      },
      // Local week of year
      w: function (date, token, localize, options) {
        var week = getUTCWeek(date, options);

        if (token === 'wo') {
          return localize.ordinalNumber(week, {
            unit: 'week'
          });
        }

        return addLeadingZeros(week, token.length);
      },
      // ISO week of year
      I: function (date, token, localize) {
        var isoWeek = getUTCISOWeek(date);

        if (token === 'Io') {
          return localize.ordinalNumber(isoWeek, {
            unit: 'week'
          });
        }

        return addLeadingZeros(isoWeek, token.length);
      },
      // Day of the month
      d: function (date, token, localize) {
        if (token === 'do') {
          return localize.ordinalNumber(date.getUTCDate(), {
            unit: 'date'
          });
        }

        return formatters$1.d(date, token);
      },
      // Day of year
      D: function (date, token, localize) {
        var dayOfYear = getUTCDayOfYear(date);

        if (token === 'Do') {
          return localize.ordinalNumber(dayOfYear, {
            unit: 'dayOfYear'
          });
        }

        return addLeadingZeros(dayOfYear, token.length);
      },
      // Day of week
      E: function (date, token, localize) {
        var dayOfWeek = date.getUTCDay();

        switch (token) {
          // Tue
          case 'E':
          case 'EE':
          case 'EEE':
            return localize.day(dayOfWeek, {
              width: 'abbreviated',
              context: 'formatting'
            });
          // T

          case 'EEEEE':
            return localize.day(dayOfWeek, {
              width: 'narrow',
              context: 'formatting'
            });
          // Tu

          case 'EEEEEE':
            return localize.day(dayOfWeek, {
              width: 'short',
              context: 'formatting'
            });
          // Tuesday

          case 'EEEE':
          default:
            return localize.day(dayOfWeek, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // Local day of week
      e: function (date, token, localize, options) {
        var dayOfWeek = date.getUTCDay();
        var localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;

        switch (token) {
          // Numerical value (Nth day of week with current locale or weekStartsOn)
          case 'e':
            return String(localDayOfWeek);
          // Padded numerical value

          case 'ee':
            return addLeadingZeros(localDayOfWeek, 2);
          // 1st, 2nd, ..., 7th

          case 'eo':
            return localize.ordinalNumber(localDayOfWeek, {
              unit: 'day'
            });

          case 'eee':
            return localize.day(dayOfWeek, {
              width: 'abbreviated',
              context: 'formatting'
            });
          // T

          case 'eeeee':
            return localize.day(dayOfWeek, {
              width: 'narrow',
              context: 'formatting'
            });
          // Tu

          case 'eeeeee':
            return localize.day(dayOfWeek, {
              width: 'short',
              context: 'formatting'
            });
          // Tuesday

          case 'eeee':
          default:
            return localize.day(dayOfWeek, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // Stand-alone local day of week
      c: function (date, token, localize, options) {
        var dayOfWeek = date.getUTCDay();
        var localDayOfWeek = (dayOfWeek - options.weekStartsOn + 8) % 7 || 7;

        switch (token) {
          // Numerical value (same as in `e`)
          case 'c':
            return String(localDayOfWeek);
          // Padded numerical value

          case 'cc':
            return addLeadingZeros(localDayOfWeek, token.length);
          // 1st, 2nd, ..., 7th

          case 'co':
            return localize.ordinalNumber(localDayOfWeek, {
              unit: 'day'
            });

          case 'ccc':
            return localize.day(dayOfWeek, {
              width: 'abbreviated',
              context: 'standalone'
            });
          // T

          case 'ccccc':
            return localize.day(dayOfWeek, {
              width: 'narrow',
              context: 'standalone'
            });
          // Tu

          case 'cccccc':
            return localize.day(dayOfWeek, {
              width: 'short',
              context: 'standalone'
            });
          // Tuesday

          case 'cccc':
          default:
            return localize.day(dayOfWeek, {
              width: 'wide',
              context: 'standalone'
            });
        }
      },
      // ISO day of week
      i: function (date, token, localize) {
        var dayOfWeek = date.getUTCDay();
        var isoDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

        switch (token) {
          // 2
          case 'i':
            return String(isoDayOfWeek);
          // 02

          case 'ii':
            return addLeadingZeros(isoDayOfWeek, token.length);
          // 2nd

          case 'io':
            return localize.ordinalNumber(isoDayOfWeek, {
              unit: 'day'
            });
          // Tue

          case 'iii':
            return localize.day(dayOfWeek, {
              width: 'abbreviated',
              context: 'formatting'
            });
          // T

          case 'iiiii':
            return localize.day(dayOfWeek, {
              width: 'narrow',
              context: 'formatting'
            });
          // Tu

          case 'iiiiii':
            return localize.day(dayOfWeek, {
              width: 'short',
              context: 'formatting'
            });
          // Tuesday

          case 'iiii':
          default:
            return localize.day(dayOfWeek, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // AM or PM
      a: function (date, token, localize) {
        var hours = date.getUTCHours();
        var dayPeriodEnumValue = hours / 12 >= 1 ? 'pm' : 'am';

        switch (token) {
          case 'a':
          case 'aa':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'abbreviated',
              context: 'formatting'
            });

          case 'aaa':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'abbreviated',
              context: 'formatting'
            }).toLowerCase();

          case 'aaaaa':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'narrow',
              context: 'formatting'
            });

          case 'aaaa':
          default:
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // AM, PM, midnight, noon
      b: function (date, token, localize) {
        var hours = date.getUTCHours();
        var dayPeriodEnumValue;

        if (hours === 12) {
          dayPeriodEnumValue = dayPeriodEnum.noon;
        } else if (hours === 0) {
          dayPeriodEnumValue = dayPeriodEnum.midnight;
        } else {
          dayPeriodEnumValue = hours / 12 >= 1 ? 'pm' : 'am';
        }

        switch (token) {
          case 'b':
          case 'bb':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'abbreviated',
              context: 'formatting'
            });

          case 'bbb':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'abbreviated',
              context: 'formatting'
            }).toLowerCase();

          case 'bbbbb':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'narrow',
              context: 'formatting'
            });

          case 'bbbb':
          default:
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // in the morning, in the afternoon, in the evening, at night
      B: function (date, token, localize) {
        var hours = date.getUTCHours();
        var dayPeriodEnumValue;

        if (hours >= 17) {
          dayPeriodEnumValue = dayPeriodEnum.evening;
        } else if (hours >= 12) {
          dayPeriodEnumValue = dayPeriodEnum.afternoon;
        } else if (hours >= 4) {
          dayPeriodEnumValue = dayPeriodEnum.morning;
        } else {
          dayPeriodEnumValue = dayPeriodEnum.night;
        }

        switch (token) {
          case 'B':
          case 'BB':
          case 'BBB':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'abbreviated',
              context: 'formatting'
            });

          case 'BBBBB':
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'narrow',
              context: 'formatting'
            });

          case 'BBBB':
          default:
            return localize.dayPeriod(dayPeriodEnumValue, {
              width: 'wide',
              context: 'formatting'
            });
        }
      },
      // Hour [1-12]
      h: function (date, token, localize) {
        if (token === 'ho') {
          var hours = date.getUTCHours() % 12;
          if (hours === 0) hours = 12;
          return localize.ordinalNumber(hours, {
            unit: 'hour'
          });
        }

        return formatters$1.h(date, token);
      },
      // Hour [0-23]
      H: function (date, token, localize) {
        if (token === 'Ho') {
          return localize.ordinalNumber(date.getUTCHours(), {
            unit: 'hour'
          });
        }

        return formatters$1.H(date, token);
      },
      // Hour [0-11]
      K: function (date, token, localize) {
        var hours = date.getUTCHours() % 12;

        if (token === 'Ko') {
          return localize.ordinalNumber(hours, {
            unit: 'hour'
          });
        }

        return addLeadingZeros(hours, token.length);
      },
      // Hour [1-24]
      k: function (date, token, localize) {
        var hours = date.getUTCHours();
        if (hours === 0) hours = 24;

        if (token === 'ko') {
          return localize.ordinalNumber(hours, {
            unit: 'hour'
          });
        }

        return addLeadingZeros(hours, token.length);
      },
      // Minute
      m: function (date, token, localize) {
        if (token === 'mo') {
          return localize.ordinalNumber(date.getUTCMinutes(), {
            unit: 'minute'
          });
        }

        return formatters$1.m(date, token);
      },
      // Second
      s: function (date, token, localize) {
        if (token === 'so') {
          return localize.ordinalNumber(date.getUTCSeconds(), {
            unit: 'second'
          });
        }

        return formatters$1.s(date, token);
      },
      // Fraction of second
      S: function (date, token) {
        return formatters$1.S(date, token);
      },
      // Timezone (ISO-8601. If offset is 0, output is always `'Z'`)
      X: function (date, token, _localize, options) {
        var originalDate = options._originalDate || date;
        var timezoneOffset = originalDate.getTimezoneOffset();

        if (timezoneOffset === 0) {
          return 'Z';
        }

        switch (token) {
          // Hours and optional minutes
          case 'X':
            return formatTimezoneWithOptionalMinutes(timezoneOffset);
          // Hours, minutes and optional seconds without `:` delimiter
          // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
          // so this token always has the same output as `XX`

          case 'XXXX':
          case 'XX':
            // Hours and minutes without `:` delimiter
            return formatTimezone(timezoneOffset);
          // Hours, minutes and optional seconds with `:` delimiter
          // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
          // so this token always has the same output as `XXX`

          case 'XXXXX':
          case 'XXX': // Hours and minutes with `:` delimiter

          default:
            return formatTimezone(timezoneOffset, ':');
        }
      },
      // Timezone (ISO-8601. If offset is 0, output is `'+00:00'` or equivalent)
      x: function (date, token, _localize, options) {
        var originalDate = options._originalDate || date;
        var timezoneOffset = originalDate.getTimezoneOffset();

        switch (token) {
          // Hours and optional minutes
          case 'x':
            return formatTimezoneWithOptionalMinutes(timezoneOffset);
          // Hours, minutes and optional seconds without `:` delimiter
          // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
          // so this token always has the same output as `xx`

          case 'xxxx':
          case 'xx':
            // Hours and minutes without `:` delimiter
            return formatTimezone(timezoneOffset);
          // Hours, minutes and optional seconds with `:` delimiter
          // Note: neither ISO-8601 nor JavaScript supports seconds in timezone offsets
          // so this token always has the same output as `xxx`

          case 'xxxxx':
          case 'xxx': // Hours and minutes with `:` delimiter

          default:
            return formatTimezone(timezoneOffset, ':');
        }
      },
      // Timezone (GMT)
      O: function (date, token, _localize, options) {
        var originalDate = options._originalDate || date;
        var timezoneOffset = originalDate.getTimezoneOffset();

        switch (token) {
          // Short
          case 'O':
          case 'OO':
          case 'OOO':
            return 'GMT' + formatTimezoneShort(timezoneOffset, ':');
          // Long

          case 'OOOO':
          default:
            return 'GMT' + formatTimezone(timezoneOffset, ':');
        }
      },
      // Timezone (specific non-location)
      z: function (date, token, _localize, options) {
        var originalDate = options._originalDate || date;
        var timezoneOffset = originalDate.getTimezoneOffset();

        switch (token) {
          // Short
          case 'z':
          case 'zz':
          case 'zzz':
            return 'GMT' + formatTimezoneShort(timezoneOffset, ':');
          // Long

          case 'zzzz':
          default:
            return 'GMT' + formatTimezone(timezoneOffset, ':');
        }
      },
      // Seconds timestamp
      t: function (date, token, _localize, options) {
        var originalDate = options._originalDate || date;
        var timestamp = Math.floor(originalDate.getTime() / 1000);
        return addLeadingZeros(timestamp, token.length);
      },
      // Milliseconds timestamp
      T: function (date, token, _localize, options) {
        var originalDate = options._originalDate || date;
        var timestamp = originalDate.getTime();
        return addLeadingZeros(timestamp, token.length);
      }
    };

    function formatTimezoneShort(offset, dirtyDelimiter) {
      var sign = offset > 0 ? '-' : '+';
      var absOffset = Math.abs(offset);
      var hours = Math.floor(absOffset / 60);
      var minutes = absOffset % 60;

      if (minutes === 0) {
        return sign + String(hours);
      }

      var delimiter = dirtyDelimiter || '';
      return sign + String(hours) + delimiter + addLeadingZeros(minutes, 2);
    }

    function formatTimezoneWithOptionalMinutes(offset, dirtyDelimiter) {
      if (offset % 60 === 0) {
        var sign = offset > 0 ? '-' : '+';
        return sign + addLeadingZeros(Math.abs(offset) / 60, 2);
      }

      return formatTimezone(offset, dirtyDelimiter);
    }

    function formatTimezone(offset, dirtyDelimiter) {
      var delimiter = dirtyDelimiter || '';
      var sign = offset > 0 ? '-' : '+';
      var absOffset = Math.abs(offset);
      var hours = addLeadingZeros(Math.floor(absOffset / 60), 2);
      var minutes = addLeadingZeros(absOffset % 60, 2);
      return sign + hours + delimiter + minutes;
    }

    function dateLongFormatter(pattern, formatLong) {
      switch (pattern) {
        case 'P':
          return formatLong.date({
            width: 'short'
          });

        case 'PP':
          return formatLong.date({
            width: 'medium'
          });

        case 'PPP':
          return formatLong.date({
            width: 'long'
          });

        case 'PPPP':
        default:
          return formatLong.date({
            width: 'full'
          });
      }
    }

    function timeLongFormatter(pattern, formatLong) {
      switch (pattern) {
        case 'p':
          return formatLong.time({
            width: 'short'
          });

        case 'pp':
          return formatLong.time({
            width: 'medium'
          });

        case 'ppp':
          return formatLong.time({
            width: 'long'
          });

        case 'pppp':
        default:
          return formatLong.time({
            width: 'full'
          });
      }
    }

    function dateTimeLongFormatter(pattern, formatLong) {
      var matchResult = pattern.match(/(P+)(p+)?/) || [];
      var datePattern = matchResult[1];
      var timePattern = matchResult[2];

      if (!timePattern) {
        return dateLongFormatter(pattern, formatLong);
      }

      var dateTimeFormat;

      switch (datePattern) {
        case 'P':
          dateTimeFormat = formatLong.dateTime({
            width: 'short'
          });
          break;

        case 'PP':
          dateTimeFormat = formatLong.dateTime({
            width: 'medium'
          });
          break;

        case 'PPP':
          dateTimeFormat = formatLong.dateTime({
            width: 'long'
          });
          break;

        case 'PPPP':
        default:
          dateTimeFormat = formatLong.dateTime({
            width: 'full'
          });
          break;
      }

      return dateTimeFormat.replace('{{date}}', dateLongFormatter(datePattern, formatLong)).replace('{{time}}', timeLongFormatter(timePattern, formatLong));
    }

    var longFormatters = {
      p: timeLongFormatter,
      P: dateTimeLongFormatter
    };

    var protectedDayOfYearTokens = ['D', 'DD'];
    var protectedWeekYearTokens = ['YY', 'YYYY'];
    function isProtectedDayOfYearToken(token) {
      return protectedDayOfYearTokens.indexOf(token) !== -1;
    }
    function isProtectedWeekYearToken(token) {
      return protectedWeekYearTokens.indexOf(token) !== -1;
    }
    function throwProtectedError(token, format, input) {
      if (token === 'YYYY') {
        throw new RangeError("Use `yyyy` instead of `YYYY` (in `".concat(format, "`) for formatting years to the input `").concat(input, "`; see: https://git.io/fxCyr"));
      } else if (token === 'YY') {
        throw new RangeError("Use `yy` instead of `YY` (in `".concat(format, "`) for formatting years to the input `").concat(input, "`; see: https://git.io/fxCyr"));
      } else if (token === 'D') {
        throw new RangeError("Use `d` instead of `D` (in `".concat(format, "`) for formatting days of the month to the input `").concat(input, "`; see: https://git.io/fxCyr"));
      } else if (token === 'DD') {
        throw new RangeError("Use `dd` instead of `DD` (in `".concat(format, "`) for formatting days of the month to the input `").concat(input, "`; see: https://git.io/fxCyr"));
      }
    }

    // - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
    //   (one of the certain letters followed by `o`)
    // - (\w)\1* matches any sequences of the same letter
    // - '' matches two quote characters in a row
    // - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
    //   except a single quote symbol, which ends the sequence.
    //   Two quote characters do not end the sequence.
    //   If there is no matching single quote
    //   then the sequence will continue until the end of the string.
    // - . matches any single character unmatched by previous parts of the RegExps

    var formattingTokensRegExp$2 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g; // This RegExp catches symbols escaped by quotes, and also
    // sequences of symbols P, p, and the combinations like `PPPPPPPppppp`

    var longFormattingTokensRegExp$1 = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
    var escapedStringRegExp$2 = /^'([^]*?)'?$/;
    var doubleQuoteRegExp$2 = /''/g;
    var unescapedLatinCharacterRegExp$2 = /[a-zA-Z]/;
    /**
     * @name format
     * @category Common Helpers
     * @summary Format the date.
     *
     * @description
     * Return the formatted date string in the given format. The result may vary by locale.
     *
     * > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
     * > See: https://git.io/fxCyr
     *
     * The characters wrapped between two single quotes characters (') are escaped.
     * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
     * (see the last example)
     *
     * Format of the string is based on Unicode Technical Standard #35:
     * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     * with a few additions (see note 7 below the table).
     *
     * Accepted patterns:
     * | Unit                            | Pattern | Result examples                   | Notes |
     * |---------------------------------|---------|-----------------------------------|-------|
     * | Era                             | G..GGG  | AD, BC                            |       |
     * |                                 | GGGG    | Anno Domini, Before Christ        | 2     |
     * |                                 | GGGGG   | A, B                              |       |
     * | Calendar year                   | y       | 44, 1, 1900, 2017                 | 5     |
     * |                                 | yo      | 44th, 1st, 0th, 17th              | 5,7   |
     * |                                 | yy      | 44, 01, 00, 17                    | 5     |
     * |                                 | yyy     | 044, 001, 1900, 2017              | 5     |
     * |                                 | yyyy    | 0044, 0001, 1900, 2017            | 5     |
     * |                                 | yyyyy   | ...                               | 3,5   |
     * | Local week-numbering year       | Y       | 44, 1, 1900, 2017                 | 5     |
     * |                                 | Yo      | 44th, 1st, 1900th, 2017th         | 5,7   |
     * |                                 | YY      | 44, 01, 00, 17                    | 5,8   |
     * |                                 | YYY     | 044, 001, 1900, 2017              | 5     |
     * |                                 | YYYY    | 0044, 0001, 1900, 2017            | 5,8   |
     * |                                 | YYYYY   | ...                               | 3,5   |
     * | ISO week-numbering year         | R       | -43, 0, 1, 1900, 2017             | 5,7   |
     * |                                 | RR      | -43, 00, 01, 1900, 2017           | 5,7   |
     * |                                 | RRR     | -043, 000, 001, 1900, 2017        | 5,7   |
     * |                                 | RRRR    | -0043, 0000, 0001, 1900, 2017     | 5,7   |
     * |                                 | RRRRR   | ...                               | 3,5,7 |
     * | Extended year                   | u       | -43, 0, 1, 1900, 2017             | 5     |
     * |                                 | uu      | -43, 01, 1900, 2017               | 5     |
     * |                                 | uuu     | -043, 001, 1900, 2017             | 5     |
     * |                                 | uuuu    | -0043, 0001, 1900, 2017           | 5     |
     * |                                 | uuuuu   | ...                               | 3,5   |
     * | Quarter (formatting)            | Q       | 1, 2, 3, 4                        |       |
     * |                                 | Qo      | 1st, 2nd, 3rd, 4th                | 7     |
     * |                                 | QQ      | 01, 02, 03, 04                    |       |
     * |                                 | QQQ     | Q1, Q2, Q3, Q4                    |       |
     * |                                 | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
     * |                                 | QQQQQ   | 1, 2, 3, 4                        | 4     |
     * | Quarter (stand-alone)           | q       | 1, 2, 3, 4                        |       |
     * |                                 | qo      | 1st, 2nd, 3rd, 4th                | 7     |
     * |                                 | qq      | 01, 02, 03, 04                    |       |
     * |                                 | qqq     | Q1, Q2, Q3, Q4                    |       |
     * |                                 | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
     * |                                 | qqqqq   | 1, 2, 3, 4                        | 4     |
     * | Month (formatting)              | M       | 1, 2, ..., 12                     |       |
     * |                                 | Mo      | 1st, 2nd, ..., 12th               | 7     |
     * |                                 | MM      | 01, 02, ..., 12                   |       |
     * |                                 | MMM     | Jan, Feb, ..., Dec                |       |
     * |                                 | MMMM    | January, February, ..., December  | 2     |
     * |                                 | MMMMM   | J, F, ..., D                      |       |
     * | Month (stand-alone)             | L       | 1, 2, ..., 12                     |       |
     * |                                 | Lo      | 1st, 2nd, ..., 12th               | 7     |
     * |                                 | LL      | 01, 02, ..., 12                   |       |
     * |                                 | LLL     | Jan, Feb, ..., Dec                |       |
     * |                                 | LLLL    | January, February, ..., December  | 2     |
     * |                                 | LLLLL   | J, F, ..., D                      |       |
     * | Local week of year              | w       | 1, 2, ..., 53                     |       |
     * |                                 | wo      | 1st, 2nd, ..., 53th               | 7     |
     * |                                 | ww      | 01, 02, ..., 53                   |       |
     * | ISO week of year                | I       | 1, 2, ..., 53                     | 7     |
     * |                                 | Io      | 1st, 2nd, ..., 53th               | 7     |
     * |                                 | II      | 01, 02, ..., 53                   | 7     |
     * | Day of month                    | d       | 1, 2, ..., 31                     |       |
     * |                                 | do      | 1st, 2nd, ..., 31st               | 7     |
     * |                                 | dd      | 01, 02, ..., 31                   |       |
     * | Day of year                     | D       | 1, 2, ..., 365, 366               | 9     |
     * |                                 | Do      | 1st, 2nd, ..., 365th, 366th       | 7     |
     * |                                 | DD      | 01, 02, ..., 365, 366             | 9     |
     * |                                 | DDD     | 001, 002, ..., 365, 366           |       |
     * |                                 | DDDD    | ...                               | 3     |
     * | Day of week (formatting)        | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
     * |                                 | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
     * |                                 | EEEEE   | M, T, W, T, F, S, S               |       |
     * |                                 | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
     * | ISO day of week (formatting)    | i       | 1, 2, 3, ..., 7                   | 7     |
     * |                                 | io      | 1st, 2nd, ..., 7th                | 7     |
     * |                                 | ii      | 01, 02, ..., 07                   | 7     |
     * |                                 | iii     | Mon, Tue, Wed, ..., Sun           | 7     |
     * |                                 | iiii    | Monday, Tuesday, ..., Sunday      | 2,7   |
     * |                                 | iiiii   | M, T, W, T, F, S, S               | 7     |
     * |                                 | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 7     |
     * | Local day of week (formatting)  | e       | 2, 3, 4, ..., 1                   |       |
     * |                                 | eo      | 2nd, 3rd, ..., 1st                | 7     |
     * |                                 | ee      | 02, 03, ..., 01                   |       |
     * |                                 | eee     | Mon, Tue, Wed, ..., Sun           |       |
     * |                                 | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
     * |                                 | eeeee   | M, T, W, T, F, S, S               |       |
     * |                                 | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
     * | Local day of week (stand-alone) | c       | 2, 3, 4, ..., 1                   |       |
     * |                                 | co      | 2nd, 3rd, ..., 1st                | 7     |
     * |                                 | cc      | 02, 03, ..., 01                   |       |
     * |                                 | ccc     | Mon, Tue, Wed, ..., Sun           |       |
     * |                                 | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
     * |                                 | ccccc   | M, T, W, T, F, S, S               |       |
     * |                                 | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
     * | AM, PM                          | a..aa   | AM, PM                            |       |
     * |                                 | aaa     | am, pm                            |       |
     * |                                 | aaaa    | a.m., p.m.                        | 2     |
     * |                                 | aaaaa   | a, p                              |       |
     * | AM, PM, noon, midnight          | b..bb   | AM, PM, noon, midnight            |       |
     * |                                 | bbb     | am, pm, noon, midnight            |       |
     * |                                 | bbbb    | a.m., p.m., noon, midnight        | 2     |
     * |                                 | bbbbb   | a, p, n, mi                       |       |
     * | Flexible day period             | B..BBB  | at night, in the morning, ...     |       |
     * |                                 | BBBB    | at night, in the morning, ...     | 2     |
     * |                                 | BBBBB   | at night, in the morning, ...     |       |
     * | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |       |
     * |                                 | ho      | 1st, 2nd, ..., 11th, 12th         | 7     |
     * |                                 | hh      | 01, 02, ..., 11, 12               |       |
     * | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |       |
     * |                                 | Ho      | 0th, 1st, 2nd, ..., 23rd          | 7     |
     * |                                 | HH      | 00, 01, 02, ..., 23               |       |
     * | Hour [0-11]                     | K       | 1, 2, ..., 11, 0                  |       |
     * |                                 | Ko      | 1st, 2nd, ..., 11th, 0th          | 7     |
     * |                                 | KK      | 01, 02, ..., 11, 00               |       |
     * | Hour [1-24]                     | k       | 24, 1, 2, ..., 23                 |       |
     * |                                 | ko      | 24th, 1st, 2nd, ..., 23rd         | 7     |
     * |                                 | kk      | 24, 01, 02, ..., 23               |       |
     * | Minute                          | m       | 0, 1, ..., 59                     |       |
     * |                                 | mo      | 0th, 1st, ..., 59th               | 7     |
     * |                                 | mm      | 00, 01, ..., 59                   |       |
     * | Second                          | s       | 0, 1, ..., 59                     |       |
     * |                                 | so      | 0th, 1st, ..., 59th               | 7     |
     * |                                 | ss      | 00, 01, ..., 59                   |       |
     * | Fraction of second              | S       | 0, 1, ..., 9                      |       |
     * |                                 | SS      | 00, 01, ..., 99                   |       |
     * |                                 | SSS     | 000, 001, ..., 999                |       |
     * |                                 | SSSS    | ...                               | 3     |
     * | Timezone (ISO-8601 w/ Z)        | X       | -08, +0530, Z                     |       |
     * |                                 | XX      | -0800, +0530, Z                   |       |
     * |                                 | XXX     | -08:00, +05:30, Z                 |       |
     * |                                 | XXXX    | -0800, +0530, Z, +123456          | 2     |
     * |                                 | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
     * | Timezone (ISO-8601 w/o Z)       | x       | -08, +0530, +00                   |       |
     * |                                 | xx      | -0800, +0530, +0000               |       |
     * |                                 | xxx     | -08:00, +05:30, +00:00            | 2     |
     * |                                 | xxxx    | -0800, +0530, +0000, +123456      |       |
     * |                                 | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
     * | Timezone (GMT)                  | O...OOO | GMT-8, GMT+5:30, GMT+0            |       |
     * |                                 | OOOO    | GMT-08:00, GMT+05:30, GMT+00:00   | 2     |
     * | Timezone (specific non-locat.)  | z...zzz | GMT-8, GMT+5:30, GMT+0            | 6     |
     * |                                 | zzzz    | GMT-08:00, GMT+05:30, GMT+00:00   | 2,6   |
     * | Seconds timestamp               | t       | 512969520                         | 7     |
     * |                                 | tt      | ...                               | 3,7   |
     * | Milliseconds timestamp          | T       | 512969520900                      | 7     |
     * |                                 | TT      | ...                               | 3,7   |
     * | Long localized date             | P       | 04/29/1453                        | 7     |
     * |                                 | PP      | Apr 29, 1453                      | 7     |
     * |                                 | PPP     | April 29th, 1453                  | 7     |
     * |                                 | PPPP    | Friday, April 29th, 1453          | 2,7   |
     * | Long localized time             | p       | 12:00 AM                          | 7     |
     * |                                 | pp      | 12:00:00 AM                       | 7     |
     * |                                 | ppp     | 12:00:00 AM GMT+2                 | 7     |
     * |                                 | pppp    | 12:00:00 AM GMT+02:00             | 2,7   |
     * | Combination of date and time    | Pp      | 04/29/1453, 12:00 AM              | 7     |
     * |                                 | PPpp    | Apr 29, 1453, 12:00:00 AM         | 7     |
     * |                                 | PPPppp  | April 29th, 1453 at ...           | 7     |
     * |                                 | PPPPpppp| Friday, April 29th, 1453 at ...   | 2,7   |
     * Notes:
     * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
     *    are the same as "stand-alone" units, but are different in some languages.
     *    "Formatting" units are declined according to the rules of the language
     *    in the context of a date. "Stand-alone" units are always nominative singular:
     *
     *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
     *
     *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
     *
     * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
     *    the single quote characters (see below).
     *    If the sequence is longer than listed in table (e.g. `EEEEEEEEEEE`)
     *    the output will be the same as default pattern for this unit, usually
     *    the longest one (in case of ISO weekdays, `EEEE`). Default patterns for units
     *    are marked with "2" in the last column of the table.
     *
     *    `format(new Date(2017, 10, 6), 'MMM') //=> 'Nov'`
     *
     *    `format(new Date(2017, 10, 6), 'MMMM') //=> 'November'`
     *
     *    `format(new Date(2017, 10, 6), 'MMMMM') //=> 'N'`
     *
     *    `format(new Date(2017, 10, 6), 'MMMMMM') //=> 'November'`
     *
     *    `format(new Date(2017, 10, 6), 'MMMMMMM') //=> 'November'`
     *
     * 3. Some patterns could be unlimited length (such as `yyyyyyyy`).
     *    The output will be padded with zeros to match the length of the pattern.
     *
     *    `format(new Date(2017, 10, 6), 'yyyyyyyy') //=> '00002017'`
     *
     * 4. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
     *    These tokens represent the shortest form of the quarter.
     *
     * 5. The main difference between `y` and `u` patterns are B.C. years:
     *
     *    | Year | `y` | `u` |
     *    |------|-----|-----|
     *    | AC 1 |   1 |   1 |
     *    | BC 1 |   1 |   0 |
     *    | BC 2 |   2 |  -1 |
     *
     *    Also `yy` always returns the last two digits of a year,
     *    while `uu` pads single digit years to 2 characters and returns other years unchanged:
     *
     *    | Year | `yy` | `uu` |
     *    |------|------|------|
     *    | 1    |   01 |   01 |
     *    | 14   |   14 |   14 |
     *    | 376  |   76 |  376 |
     *    | 1453 |   53 | 1453 |
     *
     *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
     *    except local week-numbering years are dependent on `options.weekStartsOn`
     *    and `options.firstWeekContainsDate` (compare [getISOWeekYear]{@link https://date-fns.org/docs/getISOWeekYear}
     *    and [getWeekYear]{@link https://date-fns.org/docs/getWeekYear}).
     *
     * 6. Specific non-location timezones are currently unavailable in `date-fns`,
     *    so right now these tokens fall back to GMT timezones.
     *
     * 7. These patterns are not in the Unicode Technical Standard #35:
     *    - `i`: ISO day of week
     *    - `I`: ISO week of year
     *    - `R`: ISO week-numbering year
     *    - `t`: seconds timestamp
     *    - `T`: milliseconds timestamp
     *    - `o`: ordinal number modifier
     *    - `P`: long localized date
     *    - `p`: long localized time
     *
     * 8. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
     *    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://git.io/fxCyr
     *
     * 9. `D` and `DD` tokens represent days of the year but they are often confused with days of the month.
     *    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://git.io/fxCyr
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * - The second argument is now required for the sake of explicitness.
     *
     *   ```javascript
     *   // Before v2.0.0
     *   format(new Date(2016, 0, 1))
     *
     *   // v2.0.0 onward
     *   format(new Date(2016, 0, 1), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")
     *   ```
     *
     * - New format string API for `format` function
     *   which is based on [Unicode Technical Standard #35](https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table).
     *   See [this post](https://blog.date-fns.org/post/unicode-tokens-in-date-fns-v2-sreatyki91jg) for more details.
     *
     * - Characters are now escaped using single quote symbols (`'`) instead of square brackets.
     *
     * @param {Date|Number} date - the original date
     * @param {String} format - the string of tokens
     * @param {Object} [options] - an object with options.
     * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
     * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
     * @param {Number} [options.firstWeekContainsDate=1] - the day of January, which is
     * @param {Boolean} [options.useAdditionalWeekYearTokens=false] - if true, allows usage of the week-numbering year tokens `YY` and `YYYY`;
     *   see: https://git.io/fxCyr
     * @param {Boolean} [options.useAdditionalDayOfYearTokens=false] - if true, allows usage of the day of year tokens `D` and `DD`;
     *   see: https://git.io/fxCyr
     * @returns {String} the formatted date string
     * @throws {TypeError} 2 arguments required
     * @throws {RangeError} `date` must not be Invalid Date
     * @throws {RangeError} `options.locale` must contain `localize` property
     * @throws {RangeError} `options.locale` must contain `formatLong` property
     * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
     * @throws {RangeError} `options.firstWeekContainsDate` must be between 1 and 7
     * @throws {RangeError} use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} format string contains an unescaped latin alphabet character
     *
     * @example
     * // Represent 11 February 2014 in middle-endian format:
     * var result = format(new Date(2014, 1, 11), 'MM/dd/yyyy')
     * //=> '02/11/2014'
     *
     * @example
     * // Represent 2 July 2014 in Esperanto:
     * import { eoLocale } from 'date-fns/locale/eo'
     * var result = format(new Date(2014, 6, 2), "do 'de' MMMM yyyy", {
     *   locale: eoLocale
     * })
     * //=> '2-a de julio 2014'
     *
     * @example
     * // Escape string by single quote characters:
     * var result = format(new Date(2014, 6, 2, 15), "h 'o''clock'")
     * //=> "3 o'clock"
     */

    function format(dirtyDate, dirtyFormatStr, dirtyOptions) {
      requiredArgs(2, arguments);
      var formatStr = String(dirtyFormatStr);
      var options = dirtyOptions || {};
      var locale = options.locale || locale$1;
      var localeFirstWeekContainsDate = locale.options && locale.options.firstWeekContainsDate;
      var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
      var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate); // Test if weekStartsOn is between 1 and 7 _and_ is not NaN

      if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
        throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
      }

      var localeWeekStartsOn = locale.options && locale.options.weekStartsOn;
      var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
      var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

      if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
        throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
      }

      if (!locale.localize) {
        throw new RangeError('locale must contain localize property');
      }

      if (!locale.formatLong) {
        throw new RangeError('locale must contain formatLong property');
      }

      var originalDate = toDate(dirtyDate);

      if (!isValid(originalDate)) {
        throw new RangeError('Invalid time value');
      } // Convert the date in system timezone to the same date in UTC+00:00 timezone.
      // This ensures that when UTC functions will be implemented, locales will be compatible with them.
      // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/376


      var timezoneOffset = getTimezoneOffsetInMilliseconds(originalDate);
      var utcDate = subMilliseconds(originalDate, timezoneOffset);
      var formatterOptions = {
        firstWeekContainsDate: firstWeekContainsDate,
        weekStartsOn: weekStartsOn,
        locale: locale,
        _originalDate: originalDate
      };
      var result = formatStr.match(longFormattingTokensRegExp$1).map(function (substring) {
        var firstCharacter = substring[0];

        if (firstCharacter === 'p' || firstCharacter === 'P') {
          var longFormatter = longFormatters[firstCharacter];
          return longFormatter(substring, locale.formatLong, formatterOptions);
        }

        return substring;
      }).join('').match(formattingTokensRegExp$2).map(function (substring) {
        // Replace two single quote characters with one single quote character
        if (substring === "''") {
          return "'";
        }

        var firstCharacter = substring[0];

        if (firstCharacter === "'") {
          return cleanEscapedString$2(substring);
        }

        var formatter = formatters[firstCharacter];

        if (formatter) {
          if (!options.useAdditionalWeekYearTokens && isProtectedWeekYearToken(substring)) {
            throwProtectedError(substring, dirtyFormatStr, dirtyDate);
          }

          if (!options.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(substring)) {
            throwProtectedError(substring, dirtyFormatStr, dirtyDate);
          }

          return formatter(utcDate, substring, locale.localize, formatterOptions);
        }

        if (firstCharacter.match(unescapedLatinCharacterRegExp$2)) {
          throw new RangeError('Format string contains an unescaped latin alphabet character `' + firstCharacter + '`');
        }

        return substring;
      }).join('');
      return result;
    }

    function cleanEscapedString$2(input) {
      return input.match(escapedStringRegExp$2)[1].replace(doubleQuoteRegExp$2, "'");
    }

    function assign(target, dirtyObject) {
      if (target == null) {
        throw new TypeError('assign requires that input parameter not be null or undefined');
      }

      dirtyObject = dirtyObject || {};

      for (var property in dirtyObject) {
        if (Object.prototype.hasOwnProperty.call(dirtyObject, property)) {
          target[property] = dirtyObject[property];
        }
      }

      return target;
    }

    /**
     * @name lastDayOfMonth
     * @category Month Helpers
     * @summary Return the last day of a month for the given date.
     *
     * @description
     * Return the last day of a month for the given date.
     * The result will be in the local timezone.
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * @param {Date|Number} date - the original date
     * @returns {Date} the last day of a month
     * @throws {TypeError} 1 argument required
     *
     * @example
     * // The last day of a month for 2 September 2014 11:55:00:
     * var result = lastDayOfMonth(new Date(2014, 8, 2, 11, 55, 0))
     * //=> Tue Sep 30 2014 00:00:00
     */

    function lastDayOfMonth(dirtyDate) {
      requiredArgs(1, arguments);
      var date = toDate(dirtyDate);
      var month = date.getMonth();
      date.setFullYear(date.getFullYear(), month + 1, 0);
      date.setHours(0, 0, 0, 0);
      return date;
    }

    /**
     * @name intlFormat
     * @category Common Helpers
     * @summary  Format the date with Intl.DateTimeFormat (https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat).
     *
     * @description
     * Return the formatted date string in the given format.
     * The method uses [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat) inside.
     * formatOptions are the same as [`Intl.DateTimeFormat` options](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat#using_options)
     *
     * > ⚠️ Please note that before Node version 13.0.0, only the locale data for en-US is available by default.
     *
     * @param {Date|Number} argument - the original date.
     * @param {Object} [formatOptions] - an object with options.
     * @param {'lookup'|'best fit'} [formatOptions.localeMatcher='best fit'] - locale selection algorithm.
     * @param {'narrow'|'short'|'long'} [formatOptions.weekday] - representation the days of the week.
     * @param {'narrow'|'short'|'long'} [formatOptions.era] - representation of eras.
     * @param {'numeric'|'2-digit'} [formatOptions.year] - representation of years.
     * @param {'numeric'|'2-digit'|'narrow'|'short'|'long'} [formatOptions.month='numeric'] - representation of month.
     * @param {'numeric'|'2-digit'} [formatOptions.day='numeric'] - representation of day.
     * @param {'numeric'|'2-digit'} [formatOptions.hour='numeric'] - representation of hours.
     * @param {'numeric'|'2-digit'} [formatOptions.minute] - representation of minutes.
     * @param {'numeric'|'2-digit'} [formatOptions.second] - representation of seconds.
     * @param {'short'|'long'} [formatOptions.timeZoneName] - representation of names of time zones.
     * @param {'basic'|'best fit'} [formatOptions.formatMatcher='best fit'] - format selection algorithm.
     * @param {Boolean} [formatOptions.hour12] - determines whether to use 12-hour time format.
     * @param {String} [formatOptions.timeZone] - the time zone to use.
     * @param {Object} [localeOptions] - an object with locale.
     * @param {String|String[]} [localeOptions.locale] - the locale code
     * @returns {String} the formatted date string.
     * @throws {TypeError} 1 argument required.
     * @throws {RangeError} `date` must not be Invalid Date
     *
     * @example
     * // Represent 10 October 2019 in German.
     * // Convert the date with format's options and locale's options.
     * const result = intlFormat(new Date(2019, 9, 4, 12, 30, 13, 456), {
     *      weekday: 'long',
     *      year: 'numeric',
     *      month: 'long',
     *      day: 'numeric',
     *    }, {
     *      locale: 'de-DE',
     *  })
     * //=> Freitag, 4. Oktober 2019
     *
     * @example
     * // Represent 10 October 2019.
     * // Convert the date with format's options.
     * const result = intlFormat.default(new Date(2019, 9, 4, 12, 30, 13, 456), {
     *      year: 'numeric',
     *      month: 'numeric',
     *      day: 'numeric',
     *      hour: 'numeric',
     *  })
     * //=> 10/4/2019, 12 PM
     *
     * @example
     * // Represent 10 October 2019 in Korean.
     * // Convert the date with locale's options.
     * const result = intlFormat(new Date(2019, 9, 4, 12, 30, 13, 456), {
     *      locale: 'ko-KR',
     *  })
     * //=> 2019. 10. 4.
     *
     * @example
     * // Represent 10 October 2019 in middle-endian format:
     * const result = intlFormat(new Date(2019, 9, 4, 12, 30, 13, 456))
     * //=> 10/4/2019
     */
    function intlFormat(date, formatOrLocale, localeOptions) {
      var _localeOptions;

      requiredArgs(1, arguments);
      var formatOptions;

      if (isFormatOptions(formatOrLocale)) {
        formatOptions = formatOrLocale;
      } else {
        localeOptions = formatOrLocale;
      }

      return new Intl.DateTimeFormat((_localeOptions = localeOptions) === null || _localeOptions === void 0 ? void 0 : _localeOptions.locale, formatOptions).format(date);
    }

    function isFormatOptions(opts) {
      return opts !== undefined && !('locale' in opts);
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function setUTCDay(dirtyDate, dirtyDay, dirtyOptions) {
      requiredArgs(2, arguments);
      var options = dirtyOptions || {};
      var locale = options.locale;
      var localeWeekStartsOn = locale && locale.options && locale.options.weekStartsOn;
      var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
      var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

      if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
        throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
      }

      var date = toDate(dirtyDate);
      var day = toInteger(dirtyDay);
      var currentDay = date.getUTCDay();
      var remainder = day % 7;
      var dayIndex = (remainder + 7) % 7;
      var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;
      date.setUTCDate(date.getUTCDate() + diff);
      return date;
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function setUTCISODay(dirtyDate, dirtyDay) {
      requiredArgs(2, arguments);
      var day = toInteger(dirtyDay);

      if (day % 7 === 0) {
        day = day - 7;
      }

      var weekStartsOn = 1;
      var date = toDate(dirtyDate);
      var currentDay = date.getUTCDay();
      var remainder = day % 7;
      var dayIndex = (remainder + 7) % 7;
      var diff = (dayIndex < weekStartsOn ? 7 : 0) + day - currentDay;
      date.setUTCDate(date.getUTCDate() + diff);
      return date;
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function setUTCISOWeek(dirtyDate, dirtyISOWeek) {
      requiredArgs(2, arguments);
      var date = toDate(dirtyDate);
      var isoWeek = toInteger(dirtyISOWeek);
      var diff = getUTCISOWeek(date) - isoWeek;
      date.setUTCDate(date.getUTCDate() - diff * 7);
      return date;
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function setUTCWeek(dirtyDate, dirtyWeek, options) {
      requiredArgs(2, arguments);
      var date = toDate(dirtyDate);
      var week = toInteger(dirtyWeek);
      var diff = getUTCWeek(date, options) - week;
      date.setUTCDate(date.getUTCDate() - diff * 7);
      return date;
    }

    var MILLISECONDS_IN_HOUR = 3600000;
    var MILLISECONDS_IN_MINUTE = 60000;
    var MILLISECONDS_IN_SECOND = 1000;
    var numericPatterns = {
      month: /^(1[0-2]|0?\d)/,
      // 0 to 12
      date: /^(3[0-1]|[0-2]?\d)/,
      // 0 to 31
      dayOfYear: /^(36[0-6]|3[0-5]\d|[0-2]?\d?\d)/,
      // 0 to 366
      week: /^(5[0-3]|[0-4]?\d)/,
      // 0 to 53
      hour23h: /^(2[0-3]|[0-1]?\d)/,
      // 0 to 23
      hour24h: /^(2[0-4]|[0-1]?\d)/,
      // 0 to 24
      hour11h: /^(1[0-1]|0?\d)/,
      // 0 to 11
      hour12h: /^(1[0-2]|0?\d)/,
      // 0 to 12
      minute: /^[0-5]?\d/,
      // 0 to 59
      second: /^[0-5]?\d/,
      // 0 to 59
      singleDigit: /^\d/,
      // 0 to 9
      twoDigits: /^\d{1,2}/,
      // 0 to 99
      threeDigits: /^\d{1,3}/,
      // 0 to 999
      fourDigits: /^\d{1,4}/,
      // 0 to 9999
      anyDigitsSigned: /^-?\d+/,
      singleDigitSigned: /^-?\d/,
      // 0 to 9, -0 to -9
      twoDigitsSigned: /^-?\d{1,2}/,
      // 0 to 99, -0 to -99
      threeDigitsSigned: /^-?\d{1,3}/,
      // 0 to 999, -0 to -999
      fourDigitsSigned: /^-?\d{1,4}/ // 0 to 9999, -0 to -9999

    };
    var timezonePatterns = {
      basicOptionalMinutes: /^([+-])(\d{2})(\d{2})?|Z/,
      basic: /^([+-])(\d{2})(\d{2})|Z/,
      basicOptionalSeconds: /^([+-])(\d{2})(\d{2})((\d{2}))?|Z/,
      extended: /^([+-])(\d{2}):(\d{2})|Z/,
      extendedOptionalSeconds: /^([+-])(\d{2}):(\d{2})(:(\d{2}))?|Z/
    };

    function parseNumericPattern(pattern, string, valueCallback) {
      var matchResult = string.match(pattern);

      if (!matchResult) {
        return null;
      }

      var value = parseInt(matchResult[0], 10);
      return {
        value: valueCallback ? valueCallback(value) : value,
        rest: string.slice(matchResult[0].length)
      };
    }

    function parseTimezonePattern(pattern, string) {
      var matchResult = string.match(pattern);

      if (!matchResult) {
        return null;
      } // Input is 'Z'


      if (matchResult[0] === 'Z') {
        return {
          value: 0,
          rest: string.slice(1)
        };
      }

      var sign = matchResult[1] === '+' ? 1 : -1;
      var hours = matchResult[2] ? parseInt(matchResult[2], 10) : 0;
      var minutes = matchResult[3] ? parseInt(matchResult[3], 10) : 0;
      var seconds = matchResult[5] ? parseInt(matchResult[5], 10) : 0;
      return {
        value: sign * (hours * MILLISECONDS_IN_HOUR + minutes * MILLISECONDS_IN_MINUTE + seconds * MILLISECONDS_IN_SECOND),
        rest: string.slice(matchResult[0].length)
      };
    }

    function parseAnyDigitsSigned(string, valueCallback) {
      return parseNumericPattern(numericPatterns.anyDigitsSigned, string, valueCallback);
    }

    function parseNDigits(n, string, valueCallback) {
      switch (n) {
        case 1:
          return parseNumericPattern(numericPatterns.singleDigit, string, valueCallback);

        case 2:
          return parseNumericPattern(numericPatterns.twoDigits, string, valueCallback);

        case 3:
          return parseNumericPattern(numericPatterns.threeDigits, string, valueCallback);

        case 4:
          return parseNumericPattern(numericPatterns.fourDigits, string, valueCallback);

        default:
          return parseNumericPattern(new RegExp('^\\d{1,' + n + '}'), string, valueCallback);
      }
    }

    function parseNDigitsSigned(n, string, valueCallback) {
      switch (n) {
        case 1:
          return parseNumericPattern(numericPatterns.singleDigitSigned, string, valueCallback);

        case 2:
          return parseNumericPattern(numericPatterns.twoDigitsSigned, string, valueCallback);

        case 3:
          return parseNumericPattern(numericPatterns.threeDigitsSigned, string, valueCallback);

        case 4:
          return parseNumericPattern(numericPatterns.fourDigitsSigned, string, valueCallback);

        default:
          return parseNumericPattern(new RegExp('^-?\\d{1,' + n + '}'), string, valueCallback);
      }
    }

    function dayPeriodEnumToHours(enumValue) {
      switch (enumValue) {
        case 'morning':
          return 4;

        case 'evening':
          return 17;

        case 'pm':
        case 'noon':
        case 'afternoon':
          return 12;

        case 'am':
        case 'midnight':
        case 'night':
        default:
          return 0;
      }
    }

    function normalizeTwoDigitYear(twoDigitYear, currentYear) {
      var isCommonEra = currentYear > 0; // Absolute number of the current year:
      // 1 -> 1 AC
      // 0 -> 1 BC
      // -1 -> 2 BC

      var absCurrentYear = isCommonEra ? currentYear : 1 - currentYear;
      var result;

      if (absCurrentYear <= 50) {
        result = twoDigitYear || 100;
      } else {
        var rangeEnd = absCurrentYear + 50;
        var rangeEndCentury = Math.floor(rangeEnd / 100) * 100;
        var isPreviousCentury = twoDigitYear >= rangeEnd % 100;
        result = twoDigitYear + rangeEndCentury - (isPreviousCentury ? 100 : 0);
      }

      return isCommonEra ? result : 1 - result;
    }

    var DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var DAYS_IN_MONTH_LEAP_YEAR = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; // User for validation

    function isLeapYearIndex(year) {
      return year % 400 === 0 || year % 4 === 0 && year % 100 !== 0;
    }
    /*
     * |     | Unit                           |     | Unit                           |
     * |-----|--------------------------------|-----|--------------------------------|
     * |  a  | AM, PM                         |  A* | Milliseconds in day            |
     * |  b  | AM, PM, noon, midnight         |  B  | Flexible day period            |
     * |  c  | Stand-alone local day of week  |  C* | Localized hour w/ day period   |
     * |  d  | Day of month                   |  D  | Day of year                    |
     * |  e  | Local day of week              |  E  | Day of week                    |
     * |  f  |                                |  F* | Day of week in month           |
     * |  g* | Modified Julian day            |  G  | Era                            |
     * |  h  | Hour [1-12]                    |  H  | Hour [0-23]                    |
     * |  i! | ISO day of week                |  I! | ISO week of year               |
     * |  j* | Localized hour w/ day period   |  J* | Localized hour w/o day period  |
     * |  k  | Hour [1-24]                    |  K  | Hour [0-11]                    |
     * |  l* | (deprecated)                   |  L  | Stand-alone month              |
     * |  m  | Minute                         |  M  | Month                          |
     * |  n  |                                |  N  |                                |
     * |  o! | Ordinal number modifier        |  O* | Timezone (GMT)                 |
     * |  p  |                                |  P  |                                |
     * |  q  | Stand-alone quarter            |  Q  | Quarter                        |
     * |  r* | Related Gregorian year         |  R! | ISO week-numbering year        |
     * |  s  | Second                         |  S  | Fraction of second             |
     * |  t! | Seconds timestamp              |  T! | Milliseconds timestamp         |
     * |  u  | Extended year                  |  U* | Cyclic year                    |
     * |  v* | Timezone (generic non-locat.)  |  V* | Timezone (location)            |
     * |  w  | Local week of year             |  W* | Week of month                  |
     * |  x  | Timezone (ISO-8601 w/o Z)      |  X  | Timezone (ISO-8601)            |
     * |  y  | Year (abs)                     |  Y  | Local week-numbering year      |
     * |  z* | Timezone (specific non-locat.) |  Z* | Timezone (aliases)             |
     *
     * Letters marked by * are not implemented but reserved by Unicode standard.
     *
     * Letters marked by ! are non-standard, but implemented by date-fns:
     * - `o` modifies the previous token to turn it into an ordinal (see `parse` docs)
     * - `i` is ISO day of week. For `i` and `ii` is returns numeric ISO week days,
     *   i.e. 7 for Sunday, 1 for Monday, etc.
     * - `I` is ISO week of year, as opposed to `w` which is local week of year.
     * - `R` is ISO week-numbering year, as opposed to `Y` which is local week-numbering year.
     *   `R` is supposed to be used in conjunction with `I` and `i`
     *   for universal ISO week-numbering date, whereas
     *   `Y` is supposed to be used in conjunction with `w` and `e`
     *   for week-numbering date specific to the locale.
     */


    var parsers = {
      // Era
      G: {
        priority: 140,
        parse: function (string, token, match, _options) {
          switch (token) {
            // AD, BC
            case 'G':
            case 'GG':
            case 'GGG':
              return match.era(string, {
                width: 'abbreviated'
              }) || match.era(string, {
                width: 'narrow'
              });
            // A, B

            case 'GGGGG':
              return match.era(string, {
                width: 'narrow'
              });
            // Anno Domini, Before Christ

            case 'GGGG':
            default:
              return match.era(string, {
                width: 'wide'
              }) || match.era(string, {
                width: 'abbreviated'
              }) || match.era(string, {
                width: 'narrow'
              });
          }
        },
        set: function (date, flags, value, _options) {
          flags.era = value;
          date.setUTCFullYear(value, 0, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['R', 'u', 't', 'T']
      },
      // Year
      y: {
        // From http://www.unicode.org/reports/tr35/tr35-31/tr35-dates.html#Date_Format_Patterns
        // | Year     |     y | yy |   yyy |  yyyy | yyyyy |
        // |----------|-------|----|-------|-------|-------|
        // | AD 1     |     1 | 01 |   001 |  0001 | 00001 |
        // | AD 12    |    12 | 12 |   012 |  0012 | 00012 |
        // | AD 123   |   123 | 23 |   123 |  0123 | 00123 |
        // | AD 1234  |  1234 | 34 |  1234 |  1234 | 01234 |
        // | AD 12345 | 12345 | 45 | 12345 | 12345 | 12345 |
        priority: 130,
        parse: function (string, token, match, _options) {
          var valueCallback = function (year) {
            return {
              year: year,
              isTwoDigitYear: token === 'yy'
            };
          };

          switch (token) {
            case 'y':
              return parseNDigits(4, string, valueCallback);

            case 'yo':
              return match.ordinalNumber(string, {
                unit: 'year',
                valueCallback: valueCallback
              });

            default:
              return parseNDigits(token.length, string, valueCallback);
          }
        },
        validate: function (_date, value, _options) {
          return value.isTwoDigitYear || value.year > 0;
        },
        set: function (date, flags, value, _options) {
          var currentYear = date.getUTCFullYear();

          if (value.isTwoDigitYear) {
            var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);
            date.setUTCFullYear(normalizedTwoDigitYear, 0, 1);
            date.setUTCHours(0, 0, 0, 0);
            return date;
          }

          var year = !('era' in flags) || flags.era === 1 ? value.year : 1 - value.year;
          date.setUTCFullYear(year, 0, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['Y', 'R', 'u', 'w', 'I', 'i', 'e', 'c', 't', 'T']
      },
      // Local week-numbering year
      Y: {
        priority: 130,
        parse: function (string, token, match, _options) {
          var valueCallback = function (year) {
            return {
              year: year,
              isTwoDigitYear: token === 'YY'
            };
          };

          switch (token) {
            case 'Y':
              return parseNDigits(4, string, valueCallback);

            case 'Yo':
              return match.ordinalNumber(string, {
                unit: 'year',
                valueCallback: valueCallback
              });

            default:
              return parseNDigits(token.length, string, valueCallback);
          }
        },
        validate: function (_date, value, _options) {
          return value.isTwoDigitYear || value.year > 0;
        },
        set: function (date, flags, value, options) {
          var currentYear = getUTCWeekYear(date, options);

          if (value.isTwoDigitYear) {
            var normalizedTwoDigitYear = normalizeTwoDigitYear(value.year, currentYear);
            date.setUTCFullYear(normalizedTwoDigitYear, 0, options.firstWeekContainsDate);
            date.setUTCHours(0, 0, 0, 0);
            return startOfUTCWeek(date, options);
          }

          var year = !('era' in flags) || flags.era === 1 ? value.year : 1 - value.year;
          date.setUTCFullYear(year, 0, options.firstWeekContainsDate);
          date.setUTCHours(0, 0, 0, 0);
          return startOfUTCWeek(date, options);
        },
        incompatibleTokens: ['y', 'R', 'u', 'Q', 'q', 'M', 'L', 'I', 'd', 'D', 'i', 't', 'T']
      },
      // ISO week-numbering year
      R: {
        priority: 130,
        parse: function (string, token, _match, _options) {
          if (token === 'R') {
            return parseNDigitsSigned(4, string);
          }

          return parseNDigitsSigned(token.length, string);
        },
        set: function (_date, _flags, value, _options) {
          var firstWeekOfYear = new Date(0);
          firstWeekOfYear.setUTCFullYear(value, 0, 4);
          firstWeekOfYear.setUTCHours(0, 0, 0, 0);
          return startOfUTCISOWeek(firstWeekOfYear);
        },
        incompatibleTokens: ['G', 'y', 'Y', 'u', 'Q', 'q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']
      },
      // Extended year
      u: {
        priority: 130,
        parse: function (string, token, _match, _options) {
          if (token === 'u') {
            return parseNDigitsSigned(4, string);
          }

          return parseNDigitsSigned(token.length, string);
        },
        set: function (date, _flags, value, _options) {
          date.setUTCFullYear(value, 0, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['G', 'y', 'Y', 'R', 'w', 'I', 'i', 'e', 'c', 't', 'T']
      },
      // Quarter
      Q: {
        priority: 120,
        parse: function (string, token, match, _options) {
          switch (token) {
            // 1, 2, 3, 4
            case 'Q':
            case 'QQ':
              // 01, 02, 03, 04
              return parseNDigits(token.length, string);
            // 1st, 2nd, 3rd, 4th

            case 'Qo':
              return match.ordinalNumber(string, {
                unit: 'quarter'
              });
            // Q1, Q2, Q3, Q4

            case 'QQQ':
              return match.quarter(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.quarter(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // 1, 2, 3, 4 (narrow quarter; could be not numerical)

            case 'QQQQQ':
              return match.quarter(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // 1st quarter, 2nd quarter, ...

            case 'QQQQ':
            default:
              return match.quarter(string, {
                width: 'wide',
                context: 'formatting'
              }) || match.quarter(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.quarter(string, {
                width: 'narrow',
                context: 'formatting'
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 1 && value <= 4;
        },
        set: function (date, _flags, value, _options) {
          date.setUTCMonth((value - 1) * 3, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['Y', 'R', 'q', 'M', 'L', 'w', 'I', 'd', 'D', 'i', 'e', 'c', 't', 'T']
      },
      // Stand-alone quarter
      q: {
        priority: 120,
        parse: function (string, token, match, _options) {
          switch (token) {
            // 1, 2, 3, 4
            case 'q':
            case 'qq':
              // 01, 02, 03, 04
              return parseNDigits(token.length, string);
            // 1st, 2nd, 3rd, 4th

            case 'qo':
              return match.ordinalNumber(string, {
                unit: 'quarter'
              });
            // Q1, Q2, Q3, Q4

            case 'qqq':
              return match.quarter(string, {
                width: 'abbreviated',
                context: 'standalone'
              }) || match.quarter(string, {
                width: 'narrow',
                context: 'standalone'
              });
            // 1, 2, 3, 4 (narrow quarter; could be not numerical)

            case 'qqqqq':
              return match.quarter(string, {
                width: 'narrow',
                context: 'standalone'
              });
            // 1st quarter, 2nd quarter, ...

            case 'qqqq':
            default:
              return match.quarter(string, {
                width: 'wide',
                context: 'standalone'
              }) || match.quarter(string, {
                width: 'abbreviated',
                context: 'standalone'
              }) || match.quarter(string, {
                width: 'narrow',
                context: 'standalone'
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 1 && value <= 4;
        },
        set: function (date, _flags, value, _options) {
          date.setUTCMonth((value - 1) * 3, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['Y', 'R', 'Q', 'M', 'L', 'w', 'I', 'd', 'D', 'i', 'e', 'c', 't', 'T']
      },
      // Month
      M: {
        priority: 110,
        parse: function (string, token, match, _options) {
          var valueCallback = function (value) {
            return value - 1;
          };

          switch (token) {
            // 1, 2, ..., 12
            case 'M':
              return parseNumericPattern(numericPatterns.month, string, valueCallback);
            // 01, 02, ..., 12

            case 'MM':
              return parseNDigits(2, string, valueCallback);
            // 1st, 2nd, ..., 12th

            case 'Mo':
              return match.ordinalNumber(string, {
                unit: 'month',
                valueCallback: valueCallback
              });
            // Jan, Feb, ..., Dec

            case 'MMM':
              return match.month(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.month(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // J, F, ..., D

            case 'MMMMM':
              return match.month(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // January, February, ..., December

            case 'MMMM':
            default:
              return match.month(string, {
                width: 'wide',
                context: 'formatting'
              }) || match.month(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.month(string, {
                width: 'narrow',
                context: 'formatting'
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 11;
        },
        set: function (date, _flags, value, _options) {
          date.setUTCMonth(value, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['Y', 'R', 'q', 'Q', 'L', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']
      },
      // Stand-alone month
      L: {
        priority: 110,
        parse: function (string, token, match, _options) {
          var valueCallback = function (value) {
            return value - 1;
          };

          switch (token) {
            // 1, 2, ..., 12
            case 'L':
              return parseNumericPattern(numericPatterns.month, string, valueCallback);
            // 01, 02, ..., 12

            case 'LL':
              return parseNDigits(2, string, valueCallback);
            // 1st, 2nd, ..., 12th

            case 'Lo':
              return match.ordinalNumber(string, {
                unit: 'month',
                valueCallback: valueCallback
              });
            // Jan, Feb, ..., Dec

            case 'LLL':
              return match.month(string, {
                width: 'abbreviated',
                context: 'standalone'
              }) || match.month(string, {
                width: 'narrow',
                context: 'standalone'
              });
            // J, F, ..., D

            case 'LLLLL':
              return match.month(string, {
                width: 'narrow',
                context: 'standalone'
              });
            // January, February, ..., December

            case 'LLLL':
            default:
              return match.month(string, {
                width: 'wide',
                context: 'standalone'
              }) || match.month(string, {
                width: 'abbreviated',
                context: 'standalone'
              }) || match.month(string, {
                width: 'narrow',
                context: 'standalone'
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 11;
        },
        set: function (date, _flags, value, _options) {
          date.setUTCMonth(value, 1);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['Y', 'R', 'q', 'Q', 'M', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']
      },
      // Local week of year
      w: {
        priority: 100,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'w':
              return parseNumericPattern(numericPatterns.week, string);

            case 'wo':
              return match.ordinalNumber(string, {
                unit: 'week'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 1 && value <= 53;
        },
        set: function (date, _flags, value, options) {
          return startOfUTCWeek(setUTCWeek(date, value, options), options);
        },
        incompatibleTokens: ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'i', 't', 'T']
      },
      // ISO week of year
      I: {
        priority: 100,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'I':
              return parseNumericPattern(numericPatterns.week, string);

            case 'Io':
              return match.ordinalNumber(string, {
                unit: 'week'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 1 && value <= 53;
        },
        set: function (date, _flags, value, options) {
          return startOfUTCISOWeek(setUTCISOWeek(date, value, options), options);
        },
        incompatibleTokens: ['y', 'Y', 'u', 'q', 'Q', 'M', 'L', 'w', 'd', 'D', 'e', 'c', 't', 'T']
      },
      // Day of the month
      d: {
        priority: 90,
        subPriority: 1,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'd':
              return parseNumericPattern(numericPatterns.date, string);

            case 'do':
              return match.ordinalNumber(string, {
                unit: 'date'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (date, value, _options) {
          var year = date.getUTCFullYear();
          var isLeapYear = isLeapYearIndex(year);
          var month = date.getUTCMonth();

          if (isLeapYear) {
            return value >= 1 && value <= DAYS_IN_MONTH_LEAP_YEAR[month];
          } else {
            return value >= 1 && value <= DAYS_IN_MONTH[month];
          }
        },
        set: function (date, _flags, value, _options) {
          date.setUTCDate(value);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['Y', 'R', 'q', 'Q', 'w', 'I', 'D', 'i', 'e', 'c', 't', 'T']
      },
      // Day of year
      D: {
        priority: 90,
        subPriority: 1,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'D':
            case 'DD':
              return parseNumericPattern(numericPatterns.dayOfYear, string);

            case 'Do':
              return match.ordinalNumber(string, {
                unit: 'date'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (date, value, _options) {
          var year = date.getUTCFullYear();
          var isLeapYear = isLeapYearIndex(year);

          if (isLeapYear) {
            return value >= 1 && value <= 366;
          } else {
            return value >= 1 && value <= 365;
          }
        },
        set: function (date, _flags, value, _options) {
          date.setUTCMonth(0, value);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['Y', 'R', 'q', 'Q', 'M', 'L', 'w', 'I', 'd', 'E', 'i', 'e', 'c', 't', 'T']
      },
      // Day of week
      E: {
        priority: 90,
        parse: function (string, token, match, _options) {
          switch (token) {
            // Tue
            case 'E':
            case 'EE':
            case 'EEE':
              return match.day(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.day(string, {
                width: 'short',
                context: 'formatting'
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // T

            case 'EEEEE':
              return match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // Tu

            case 'EEEEEE':
              return match.day(string, {
                width: 'short',
                context: 'formatting'
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // Tuesday

            case 'EEEE':
            default:
              return match.day(string, {
                width: 'wide',
                context: 'formatting'
              }) || match.day(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.day(string, {
                width: 'short',
                context: 'formatting'
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 6;
        },
        set: function (date, _flags, value, options) {
          date = setUTCDay(date, value, options);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['D', 'i', 'e', 'c', 't', 'T']
      },
      // Local day of week
      e: {
        priority: 90,
        parse: function (string, token, match, options) {
          var valueCallback = function (value) {
            var wholeWeekDays = Math.floor((value - 1) / 7) * 7;
            return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
          };

          switch (token) {
            // 3
            case 'e':
            case 'ee':
              // 03
              return parseNDigits(token.length, string, valueCallback);
            // 3rd

            case 'eo':
              return match.ordinalNumber(string, {
                unit: 'day',
                valueCallback: valueCallback
              });
            // Tue

            case 'eee':
              return match.day(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.day(string, {
                width: 'short',
                context: 'formatting'
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // T

            case 'eeeee':
              return match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // Tu

            case 'eeeeee':
              return match.day(string, {
                width: 'short',
                context: 'formatting'
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
            // Tuesday

            case 'eeee':
            default:
              return match.day(string, {
                width: 'wide',
                context: 'formatting'
              }) || match.day(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.day(string, {
                width: 'short',
                context: 'formatting'
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting'
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 6;
        },
        set: function (date, _flags, value, options) {
          date = setUTCDay(date, value, options);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'E', 'i', 'c', 't', 'T']
      },
      // Stand-alone local day of week
      c: {
        priority: 90,
        parse: function (string, token, match, options) {
          var valueCallback = function (value) {
            var wholeWeekDays = Math.floor((value - 1) / 7) * 7;
            return (value + options.weekStartsOn + 6) % 7 + wholeWeekDays;
          };

          switch (token) {
            // 3
            case 'c':
            case 'cc':
              // 03
              return parseNDigits(token.length, string, valueCallback);
            // 3rd

            case 'co':
              return match.ordinalNumber(string, {
                unit: 'day',
                valueCallback: valueCallback
              });
            // Tue

            case 'ccc':
              return match.day(string, {
                width: 'abbreviated',
                context: 'standalone'
              }) || match.day(string, {
                width: 'short',
                context: 'standalone'
              }) || match.day(string, {
                width: 'narrow',
                context: 'standalone'
              });
            // T

            case 'ccccc':
              return match.day(string, {
                width: 'narrow',
                context: 'standalone'
              });
            // Tu

            case 'cccccc':
              return match.day(string, {
                width: 'short',
                context: 'standalone'
              }) || match.day(string, {
                width: 'narrow',
                context: 'standalone'
              });
            // Tuesday

            case 'cccc':
            default:
              return match.day(string, {
                width: 'wide',
                context: 'standalone'
              }) || match.day(string, {
                width: 'abbreviated',
                context: 'standalone'
              }) || match.day(string, {
                width: 'short',
                context: 'standalone'
              }) || match.day(string, {
                width: 'narrow',
                context: 'standalone'
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 6;
        },
        set: function (date, _flags, value, options) {
          date = setUTCDay(date, value, options);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['y', 'R', 'u', 'q', 'Q', 'M', 'L', 'I', 'd', 'D', 'E', 'i', 'e', 't', 'T']
      },
      // ISO day of week
      i: {
        priority: 90,
        parse: function (string, token, match, _options) {
          var valueCallback = function (value) {
            if (value === 0) {
              return 7;
            }

            return value;
          };

          switch (token) {
            // 2
            case 'i':
            case 'ii':
              // 02
              return parseNDigits(token.length, string);
            // 2nd

            case 'io':
              return match.ordinalNumber(string, {
                unit: 'day'
              });
            // Tue

            case 'iii':
              return match.day(string, {
                width: 'abbreviated',
                context: 'formatting',
                valueCallback: valueCallback
              }) || match.day(string, {
                width: 'short',
                context: 'formatting',
                valueCallback: valueCallback
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting',
                valueCallback: valueCallback
              });
            // T

            case 'iiiii':
              return match.day(string, {
                width: 'narrow',
                context: 'formatting',
                valueCallback: valueCallback
              });
            // Tu

            case 'iiiiii':
              return match.day(string, {
                width: 'short',
                context: 'formatting',
                valueCallback: valueCallback
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting',
                valueCallback: valueCallback
              });
            // Tuesday

            case 'iiii':
            default:
              return match.day(string, {
                width: 'wide',
                context: 'formatting',
                valueCallback: valueCallback
              }) || match.day(string, {
                width: 'abbreviated',
                context: 'formatting',
                valueCallback: valueCallback
              }) || match.day(string, {
                width: 'short',
                context: 'formatting',
                valueCallback: valueCallback
              }) || match.day(string, {
                width: 'narrow',
                context: 'formatting',
                valueCallback: valueCallback
              });
          }
        },
        validate: function (_date, value, _options) {
          return value >= 1 && value <= 7;
        },
        set: function (date, _flags, value, options) {
          date = setUTCISODay(date, value, options);
          date.setUTCHours(0, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['y', 'Y', 'u', 'q', 'Q', 'M', 'L', 'w', 'd', 'D', 'E', 'e', 'c', 't', 'T']
      },
      // AM or PM
      a: {
        priority: 80,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'a':
            case 'aa':
            case 'aaa':
              return match.dayPeriod(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });

            case 'aaaaa':
              return match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });

            case 'aaaa':
            default:
              return match.dayPeriod(string, {
                width: 'wide',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });
          }
        },
        set: function (date, _flags, value, _options) {
          date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['b', 'B', 'H', 'k', 't', 'T']
      },
      // AM, PM, midnight
      b: {
        priority: 80,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'b':
            case 'bb':
            case 'bbb':
              return match.dayPeriod(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });

            case 'bbbbb':
              return match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });

            case 'bbbb':
            default:
              return match.dayPeriod(string, {
                width: 'wide',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });
          }
        },
        set: function (date, _flags, value, _options) {
          date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['a', 'B', 'H', 'k', 't', 'T']
      },
      // in the morning, in the afternoon, in the evening, at night
      B: {
        priority: 80,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'B':
            case 'BB':
            case 'BBB':
              return match.dayPeriod(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });

            case 'BBBBB':
              return match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });

            case 'BBBB':
            default:
              return match.dayPeriod(string, {
                width: 'wide',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'abbreviated',
                context: 'formatting'
              }) || match.dayPeriod(string, {
                width: 'narrow',
                context: 'formatting'
              });
          }
        },
        set: function (date, _flags, value, _options) {
          date.setUTCHours(dayPeriodEnumToHours(value), 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['a', 'b', 't', 'T']
      },
      // Hour [1-12]
      h: {
        priority: 70,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'h':
              return parseNumericPattern(numericPatterns.hour12h, string);

            case 'ho':
              return match.ordinalNumber(string, {
                unit: 'hour'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 1 && value <= 12;
        },
        set: function (date, _flags, value, _options) {
          var isPM = date.getUTCHours() >= 12;

          if (isPM && value < 12) {
            date.setUTCHours(value + 12, 0, 0, 0);
          } else if (!isPM && value === 12) {
            date.setUTCHours(0, 0, 0, 0);
          } else {
            date.setUTCHours(value, 0, 0, 0);
          }

          return date;
        },
        incompatibleTokens: ['H', 'K', 'k', 't', 'T']
      },
      // Hour [0-23]
      H: {
        priority: 70,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'H':
              return parseNumericPattern(numericPatterns.hour23h, string);

            case 'Ho':
              return match.ordinalNumber(string, {
                unit: 'hour'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 23;
        },
        set: function (date, _flags, value, _options) {
          date.setUTCHours(value, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['a', 'b', 'h', 'K', 'k', 't', 'T']
      },
      // Hour [0-11]
      K: {
        priority: 70,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'K':
              return parseNumericPattern(numericPatterns.hour11h, string);

            case 'Ko':
              return match.ordinalNumber(string, {
                unit: 'hour'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 11;
        },
        set: function (date, _flags, value, _options) {
          var isPM = date.getUTCHours() >= 12;

          if (isPM && value < 12) {
            date.setUTCHours(value + 12, 0, 0, 0);
          } else {
            date.setUTCHours(value, 0, 0, 0);
          }

          return date;
        },
        incompatibleTokens: ['h', 'H', 'k', 't', 'T']
      },
      // Hour [1-24]
      k: {
        priority: 70,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'k':
              return parseNumericPattern(numericPatterns.hour24h, string);

            case 'ko':
              return match.ordinalNumber(string, {
                unit: 'hour'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 1 && value <= 24;
        },
        set: function (date, _flags, value, _options) {
          var hours = value <= 24 ? value % 24 : value;
          date.setUTCHours(hours, 0, 0, 0);
          return date;
        },
        incompatibleTokens: ['a', 'b', 'h', 'H', 'K', 't', 'T']
      },
      // Minute
      m: {
        priority: 60,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 'm':
              return parseNumericPattern(numericPatterns.minute, string);

            case 'mo':
              return match.ordinalNumber(string, {
                unit: 'minute'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 59;
        },
        set: function (date, _flags, value, _options) {
          date.setUTCMinutes(value, 0, 0);
          return date;
        },
        incompatibleTokens: ['t', 'T']
      },
      // Second
      s: {
        priority: 50,
        parse: function (string, token, match, _options) {
          switch (token) {
            case 's':
              return parseNumericPattern(numericPatterns.second, string);

            case 'so':
              return match.ordinalNumber(string, {
                unit: 'second'
              });

            default:
              return parseNDigits(token.length, string);
          }
        },
        validate: function (_date, value, _options) {
          return value >= 0 && value <= 59;
        },
        set: function (date, _flags, value, _options) {
          date.setUTCSeconds(value, 0);
          return date;
        },
        incompatibleTokens: ['t', 'T']
      },
      // Fraction of second
      S: {
        priority: 30,
        parse: function (string, token, _match, _options) {
          var valueCallback = function (value) {
            return Math.floor(value * Math.pow(10, -token.length + 3));
          };

          return parseNDigits(token.length, string, valueCallback);
        },
        set: function (date, _flags, value, _options) {
          date.setUTCMilliseconds(value);
          return date;
        },
        incompatibleTokens: ['t', 'T']
      },
      // Timezone (ISO-8601. +00:00 is `'Z'`)
      X: {
        priority: 10,
        parse: function (string, token, _match, _options) {
          switch (token) {
            case 'X':
              return parseTimezonePattern(timezonePatterns.basicOptionalMinutes, string);

            case 'XX':
              return parseTimezonePattern(timezonePatterns.basic, string);

            case 'XXXX':
              return parseTimezonePattern(timezonePatterns.basicOptionalSeconds, string);

            case 'XXXXX':
              return parseTimezonePattern(timezonePatterns.extendedOptionalSeconds, string);

            case 'XXX':
            default:
              return parseTimezonePattern(timezonePatterns.extended, string);
          }
        },
        set: function (date, flags, value, _options) {
          if (flags.timestampIsSet) {
            return date;
          }

          return new Date(date.getTime() - value);
        },
        incompatibleTokens: ['t', 'T', 'x']
      },
      // Timezone (ISO-8601)
      x: {
        priority: 10,
        parse: function (string, token, _match, _options) {
          switch (token) {
            case 'x':
              return parseTimezonePattern(timezonePatterns.basicOptionalMinutes, string);

            case 'xx':
              return parseTimezonePattern(timezonePatterns.basic, string);

            case 'xxxx':
              return parseTimezonePattern(timezonePatterns.basicOptionalSeconds, string);

            case 'xxxxx':
              return parseTimezonePattern(timezonePatterns.extendedOptionalSeconds, string);

            case 'xxx':
            default:
              return parseTimezonePattern(timezonePatterns.extended, string);
          }
        },
        set: function (date, flags, value, _options) {
          if (flags.timestampIsSet) {
            return date;
          }

          return new Date(date.getTime() - value);
        },
        incompatibleTokens: ['t', 'T', 'X']
      },
      // Seconds timestamp
      t: {
        priority: 40,
        parse: function (string, _token, _match, _options) {
          return parseAnyDigitsSigned(string);
        },
        set: function (_date, _flags, value, _options) {
          return [new Date(value * 1000), {
            timestampIsSet: true
          }];
        },
        incompatibleTokens: '*'
      },
      // Milliseconds timestamp
      T: {
        priority: 20,
        parse: function (string, _token, _match, _options) {
          return parseAnyDigitsSigned(string);
        },
        set: function (_date, _flags, value, _options) {
          return [new Date(value), {
            timestampIsSet: true
          }];
        },
        incompatibleTokens: '*'
      }
    };

    var TIMEZONE_UNIT_PRIORITY = 10; // This RegExp consists of three parts separated by `|`:
    // - [yYQqMLwIdDecihHKkms]o matches any available ordinal number token
    //   (one of the certain letters followed by `o`)
    // - (\w)\1* matches any sequences of the same letter
    // - '' matches two quote characters in a row
    // - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
    //   except a single quote symbol, which ends the sequence.
    //   Two quote characters do not end the sequence.
    //   If there is no matching single quote
    //   then the sequence will continue until the end of the string.
    // - . matches any single character unmatched by previous parts of the RegExps

    var formattingTokensRegExp$1 = /[yYQqMLwIdDecihHKkms]o|(\w)\1*|''|'(''|[^'])+('|$)|./g; // This RegExp catches symbols escaped by quotes, and also
    // sequences of symbols P, p, and the combinations like `PPPPPPPppppp`

    var longFormattingTokensRegExp = /P+p+|P+|p+|''|'(''|[^'])+('|$)|./g;
    var escapedStringRegExp$1 = /^'([^]*?)'?$/;
    var doubleQuoteRegExp$1 = /''/g;
    var notWhitespaceRegExp = /\S/;
    var unescapedLatinCharacterRegExp$1 = /[a-zA-Z]/;
    /**
     * @name parse
     * @category Common Helpers
     * @summary Parse the date.
     *
     * @description
     * Return the date parsed from string using the given format string.
     *
     * > ⚠️ Please note that the `format` tokens differ from Moment.js and other libraries.
     * > See: https://git.io/fxCyr
     *
     * The characters in the format string wrapped between two single quotes characters (') are escaped.
     * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
     *
     * Format of the format string is based on Unicode Technical Standard #35:
     * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     * with a few additions (see note 5 below the table).
     *
     * Not all tokens are compatible. Combinations that don't make sense or could lead to bugs are prohibited
     * and will throw `RangeError`. For example usage of 24-hour format token with AM/PM token will throw an exception:
     *
     * ```javascript
     * parse('23 AM', 'HH a', new Date())
     * //=> RangeError: The format string mustn't contain `HH` and `a` at the same time
     * ```
     *
     * See the compatibility table: https://docs.google.com/spreadsheets/d/e/2PACX-1vQOPU3xUhplll6dyoMmVUXHKl_8CRDs6_ueLmex3SoqwhuolkuN3O05l4rqx5h1dKX8eb46Ul-CCSrq/pubhtml?gid=0&single=true
     *
     * Accepted format string patterns:
     * | Unit                            |Prior| Pattern | Result examples                   | Notes |
     * |---------------------------------|-----|---------|-----------------------------------|-------|
     * | Era                             | 140 | G..GGG  | AD, BC                            |       |
     * |                                 |     | GGGG    | Anno Domini, Before Christ        | 2     |
     * |                                 |     | GGGGG   | A, B                              |       |
     * | Calendar year                   | 130 | y       | 44, 1, 1900, 2017, 9999           | 4     |
     * |                                 |     | yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
     * |                                 |     | yy      | 44, 01, 00, 17                    | 4     |
     * |                                 |     | yyy     | 044, 001, 123, 999                | 4     |
     * |                                 |     | yyyy    | 0044, 0001, 1900, 2017            | 4     |
     * |                                 |     | yyyyy   | ...                               | 2,4   |
     * | Local week-numbering year       | 130 | Y       | 44, 1, 1900, 2017, 9000           | 4     |
     * |                                 |     | Yo      | 44th, 1st, 1900th, 9999999th      | 4,5   |
     * |                                 |     | YY      | 44, 01, 00, 17                    | 4,6   |
     * |                                 |     | YYY     | 044, 001, 123, 999                | 4     |
     * |                                 |     | YYYY    | 0044, 0001, 1900, 2017            | 4,6   |
     * |                                 |     | YYYYY   | ...                               | 2,4   |
     * | ISO week-numbering year         | 130 | R       | -43, 1, 1900, 2017, 9999, -9999   | 4,5   |
     * |                                 |     | RR      | -43, 01, 00, 17                   | 4,5   |
     * |                                 |     | RRR     | -043, 001, 123, 999, -999         | 4,5   |
     * |                                 |     | RRRR    | -0043, 0001, 2017, 9999, -9999    | 4,5   |
     * |                                 |     | RRRRR   | ...                               | 2,4,5 |
     * | Extended year                   | 130 | u       | -43, 1, 1900, 2017, 9999, -999    | 4     |
     * |                                 |     | uu      | -43, 01, 99, -99                  | 4     |
     * |                                 |     | uuu     | -043, 001, 123, 999, -999         | 4     |
     * |                                 |     | uuuu    | -0043, 0001, 2017, 9999, -9999    | 4     |
     * |                                 |     | uuuuu   | ...                               | 2,4   |
     * | Quarter (formatting)            | 120 | Q       | 1, 2, 3, 4                        |       |
     * |                                 |     | Qo      | 1st, 2nd, 3rd, 4th                | 5     |
     * |                                 |     | QQ      | 01, 02, 03, 04                    |       |
     * |                                 |     | QQQ     | Q1, Q2, Q3, Q4                    |       |
     * |                                 |     | QQQQ    | 1st quarter, 2nd quarter, ...     | 2     |
     * |                                 |     | QQQQQ   | 1, 2, 3, 4                        | 4     |
     * | Quarter (stand-alone)           | 120 | q       | 1, 2, 3, 4                        |       |
     * |                                 |     | qo      | 1st, 2nd, 3rd, 4th                | 5     |
     * |                                 |     | qq      | 01, 02, 03, 04                    |       |
     * |                                 |     | qqq     | Q1, Q2, Q3, Q4                    |       |
     * |                                 |     | qqqq    | 1st quarter, 2nd quarter, ...     | 2     |
     * |                                 |     | qqqqq   | 1, 2, 3, 4                        | 3     |
     * | Month (formatting)              | 110 | M       | 1, 2, ..., 12                     |       |
     * |                                 |     | Mo      | 1st, 2nd, ..., 12th               | 5     |
     * |                                 |     | MM      | 01, 02, ..., 12                   |       |
     * |                                 |     | MMM     | Jan, Feb, ..., Dec                |       |
     * |                                 |     | MMMM    | January, February, ..., December  | 2     |
     * |                                 |     | MMMMM   | J, F, ..., D                      |       |
     * | Month (stand-alone)             | 110 | L       | 1, 2, ..., 12                     |       |
     * |                                 |     | Lo      | 1st, 2nd, ..., 12th               | 5     |
     * |                                 |     | LL      | 01, 02, ..., 12                   |       |
     * |                                 |     | LLL     | Jan, Feb, ..., Dec                |       |
     * |                                 |     | LLLL    | January, February, ..., December  | 2     |
     * |                                 |     | LLLLL   | J, F, ..., D                      |       |
     * | Local week of year              | 100 | w       | 1, 2, ..., 53                     |       |
     * |                                 |     | wo      | 1st, 2nd, ..., 53th               | 5     |
     * |                                 |     | ww      | 01, 02, ..., 53                   |       |
     * | ISO week of year                | 100 | I       | 1, 2, ..., 53                     | 5     |
     * |                                 |     | Io      | 1st, 2nd, ..., 53th               | 5     |
     * |                                 |     | II      | 01, 02, ..., 53                   | 5     |
     * | Day of month                    |  90 | d       | 1, 2, ..., 31                     |       |
     * |                                 |     | do      | 1st, 2nd, ..., 31st               | 5     |
     * |                                 |     | dd      | 01, 02, ..., 31                   |       |
     * | Day of year                     |  90 | D       | 1, 2, ..., 365, 366               | 7     |
     * |                                 |     | Do      | 1st, 2nd, ..., 365th, 366th       | 5     |
     * |                                 |     | DD      | 01, 02, ..., 365, 366             | 7     |
     * |                                 |     | DDD     | 001, 002, ..., 365, 366           |       |
     * |                                 |     | DDDD    | ...                               | 2     |
     * | Day of week (formatting)        |  90 | E..EEE  | Mon, Tue, Wed, ..., Sun           |       |
     * |                                 |     | EEEE    | Monday, Tuesday, ..., Sunday      | 2     |
     * |                                 |     | EEEEE   | M, T, W, T, F, S, S               |       |
     * |                                 |     | EEEEEE  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
     * | ISO day of week (formatting)    |  90 | i       | 1, 2, 3, ..., 7                   | 5     |
     * |                                 |     | io      | 1st, 2nd, ..., 7th                | 5     |
     * |                                 |     | ii      | 01, 02, ..., 07                   | 5     |
     * |                                 |     | iii     | Mon, Tue, Wed, ..., Sun           | 5     |
     * |                                 |     | iiii    | Monday, Tuesday, ..., Sunday      | 2,5   |
     * |                                 |     | iiiii   | M, T, W, T, F, S, S               | 5     |
     * |                                 |     | iiiiii  | Mo, Tu, We, Th, Fr, Sa, Su        | 5     |
     * | Local day of week (formatting)  |  90 | e       | 2, 3, 4, ..., 1                   |       |
     * |                                 |     | eo      | 2nd, 3rd, ..., 1st                | 5     |
     * |                                 |     | ee      | 02, 03, ..., 01                   |       |
     * |                                 |     | eee     | Mon, Tue, Wed, ..., Sun           |       |
     * |                                 |     | eeee    | Monday, Tuesday, ..., Sunday      | 2     |
     * |                                 |     | eeeee   | M, T, W, T, F, S, S               |       |
     * |                                 |     | eeeeee  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
     * | Local day of week (stand-alone) |  90 | c       | 2, 3, 4, ..., 1                   |       |
     * |                                 |     | co      | 2nd, 3rd, ..., 1st                | 5     |
     * |                                 |     | cc      | 02, 03, ..., 01                   |       |
     * |                                 |     | ccc     | Mon, Tue, Wed, ..., Sun           |       |
     * |                                 |     | cccc    | Monday, Tuesday, ..., Sunday      | 2     |
     * |                                 |     | ccccc   | M, T, W, T, F, S, S               |       |
     * |                                 |     | cccccc  | Mo, Tu, We, Th, Fr, Sa, Su        |       |
     * | AM, PM                          |  80 | a..aaa  | AM, PM                            |       |
     * |                                 |     | aaaa    | a.m., p.m.                        | 2     |
     * |                                 |     | aaaaa   | a, p                              |       |
     * | AM, PM, noon, midnight          |  80 | b..bbb  | AM, PM, noon, midnight            |       |
     * |                                 |     | bbbb    | a.m., p.m., noon, midnight        | 2     |
     * |                                 |     | bbbbb   | a, p, n, mi                       |       |
     * | Flexible day period             |  80 | B..BBB  | at night, in the morning, ...     |       |
     * |                                 |     | BBBB    | at night, in the morning, ...     | 2     |
     * |                                 |     | BBBBB   | at night, in the morning, ...     |       |
     * | Hour [1-12]                     |  70 | h       | 1, 2, ..., 11, 12                 |       |
     * |                                 |     | ho      | 1st, 2nd, ..., 11th, 12th         | 5     |
     * |                                 |     | hh      | 01, 02, ..., 11, 12               |       |
     * | Hour [0-23]                     |  70 | H       | 0, 1, 2, ..., 23                  |       |
     * |                                 |     | Ho      | 0th, 1st, 2nd, ..., 23rd          | 5     |
     * |                                 |     | HH      | 00, 01, 02, ..., 23               |       |
     * | Hour [0-11]                     |  70 | K       | 1, 2, ..., 11, 0                  |       |
     * |                                 |     | Ko      | 1st, 2nd, ..., 11th, 0th          | 5     |
     * |                                 |     | KK      | 01, 02, ..., 11, 00               |       |
     * | Hour [1-24]                     |  70 | k       | 24, 1, 2, ..., 23                 |       |
     * |                                 |     | ko      | 24th, 1st, 2nd, ..., 23rd         | 5     |
     * |                                 |     | kk      | 24, 01, 02, ..., 23               |       |
     * | Minute                          |  60 | m       | 0, 1, ..., 59                     |       |
     * |                                 |     | mo      | 0th, 1st, ..., 59th               | 5     |
     * |                                 |     | mm      | 00, 01, ..., 59                   |       |
     * | Second                          |  50 | s       | 0, 1, ..., 59                     |       |
     * |                                 |     | so      | 0th, 1st, ..., 59th               | 5     |
     * |                                 |     | ss      | 00, 01, ..., 59                   |       |
     * | Seconds timestamp               |  40 | t       | 512969520                         |       |
     * |                                 |     | tt      | ...                               | 2     |
     * | Fraction of second              |  30 | S       | 0, 1, ..., 9                      |       |
     * |                                 |     | SS      | 00, 01, ..., 99                   |       |
     * |                                 |     | SSS     | 000, 001, ..., 999                |       |
     * |                                 |     | SSSS    | ...                               | 2     |
     * | Milliseconds timestamp          |  20 | T       | 512969520900                      |       |
     * |                                 |     | TT      | ...                               | 2     |
     * | Timezone (ISO-8601 w/ Z)        |  10 | X       | -08, +0530, Z                     |       |
     * |                                 |     | XX      | -0800, +0530, Z                   |       |
     * |                                 |     | XXX     | -08:00, +05:30, Z                 |       |
     * |                                 |     | XXXX    | -0800, +0530, Z, +123456          | 2     |
     * |                                 |     | XXXXX   | -08:00, +05:30, Z, +12:34:56      |       |
     * | Timezone (ISO-8601 w/o Z)       |  10 | x       | -08, +0530, +00                   |       |
     * |                                 |     | xx      | -0800, +0530, +0000               |       |
     * |                                 |     | xxx     | -08:00, +05:30, +00:00            | 2     |
     * |                                 |     | xxxx    | -0800, +0530, +0000, +123456      |       |
     * |                                 |     | xxxxx   | -08:00, +05:30, +00:00, +12:34:56 |       |
     * | Long localized date             |  NA | P       | 05/29/1453                        | 5,8   |
     * |                                 |     | PP      | May 29, 1453                      |       |
     * |                                 |     | PPP     | May 29th, 1453                    |       |
     * |                                 |     | PPPP    | Sunday, May 29th, 1453            | 2,5,8 |
     * | Long localized time             |  NA | p       | 12:00 AM                          | 5,8   |
     * |                                 |     | pp      | 12:00:00 AM                       |       |
     * | Combination of date and time    |  NA | Pp      | 05/29/1453, 12:00 AM              |       |
     * |                                 |     | PPpp    | May 29, 1453, 12:00:00 AM         |       |
     * |                                 |     | PPPpp   | May 29th, 1453 at ...             |       |
     * |                                 |     | PPPPpp  | Sunday, May 29th, 1453 at ...     | 2,5,8 |
     * Notes:
     * 1. "Formatting" units (e.g. formatting quarter) in the default en-US locale
     *    are the same as "stand-alone" units, but are different in some languages.
     *    "Formatting" units are declined according to the rules of the language
     *    in the context of a date. "Stand-alone" units are always nominative singular.
     *    In `format` function, they will produce different result:
     *
     *    `format(new Date(2017, 10, 6), 'do LLLL', {locale: cs}) //=> '6. listopad'`
     *
     *    `format(new Date(2017, 10, 6), 'do MMMM', {locale: cs}) //=> '6. listopadu'`
     *
     *    `parse` will try to match both formatting and stand-alone units interchangably.
     *
     * 2. Any sequence of the identical letters is a pattern, unless it is escaped by
     *    the single quote characters (see below).
     *    If the sequence is longer than listed in table:
     *    - for numerical units (`yyyyyyyy`) `parse` will try to match a number
     *      as wide as the sequence
     *    - for text units (`MMMMMMMM`) `parse` will try to match the widest variation of the unit.
     *      These variations are marked with "2" in the last column of the table.
     *
     * 3. `QQQQQ` and `qqqqq` could be not strictly numerical in some locales.
     *    These tokens represent the shortest form of the quarter.
     *
     * 4. The main difference between `y` and `u` patterns are B.C. years:
     *
     *    | Year | `y` | `u` |
     *    |------|-----|-----|
     *    | AC 1 |   1 |   1 |
     *    | BC 1 |   1 |   0 |
     *    | BC 2 |   2 |  -1 |
     *
     *    Also `yy` will try to guess the century of two digit year by proximity with `referenceDate`:
     *
     *    `parse('50', 'yy', new Date(2018, 0, 1)) //=> Sat Jan 01 2050 00:00:00`
     *
     *    `parse('75', 'yy', new Date(2018, 0, 1)) //=> Wed Jan 01 1975 00:00:00`
     *
     *    while `uu` will just assign the year as is:
     *
     *    `parse('50', 'uu', new Date(2018, 0, 1)) //=> Sat Jan 01 0050 00:00:00`
     *
     *    `parse('75', 'uu', new Date(2018, 0, 1)) //=> Tue Jan 01 0075 00:00:00`
     *
     *    The same difference is true for local and ISO week-numbering years (`Y` and `R`),
     *    except local week-numbering years are dependent on `options.weekStartsOn`
     *    and `options.firstWeekContainsDate` (compare [setISOWeekYear]{@link https://date-fns.org/docs/setISOWeekYear}
     *    and [setWeekYear]{@link https://date-fns.org/docs/setWeekYear}).
     *
     * 5. These patterns are not in the Unicode Technical Standard #35:
     *    - `i`: ISO day of week
     *    - `I`: ISO week of year
     *    - `R`: ISO week-numbering year
     *    - `o`: ordinal number modifier
     *    - `P`: long localized date
     *    - `p`: long localized time
     *
     * 6. `YY` and `YYYY` tokens represent week-numbering years but they are often confused with years.
     *    You should enable `options.useAdditionalWeekYearTokens` to use them. See: https://git.io/fxCyr
     *
     * 7. `D` and `DD` tokens represent days of the year but they are ofthen confused with days of the month.
     *    You should enable `options.useAdditionalDayOfYearTokens` to use them. See: https://git.io/fxCyr
     *
     * 8. `P+` tokens do not have a defined priority since they are merely aliases to other tokens based
     *    on the given locale.
     *
     *    using `en-US` locale: `P` => `MM/dd/yyyy`
     *    using `en-US` locale: `p` => `hh:mm a`
     *    using `pt-BR` locale: `P` => `dd/MM/yyyy`
     *    using `pt-BR` locale: `p` => `HH:mm`
     *
     * Values will be assigned to the date in the descending order of its unit's priority.
     * Units of an equal priority overwrite each other in the order of appearance.
     *
     * If no values of higher priority are parsed (e.g. when parsing string 'January 1st' without a year),
     * the values will be taken from 3rd argument `referenceDate` which works as a context of parsing.
     *
     * `referenceDate` must be passed for correct work of the function.
     * If you're not sure which `referenceDate` to supply, create a new instance of Date:
     * `parse('02/11/2014', 'MM/dd/yyyy', new Date())`
     * In this case parsing will be done in the context of the current date.
     * If `referenceDate` is `Invalid Date` or a value not convertible to valid `Date`,
     * then `Invalid Date` will be returned.
     *
     * The result may vary by locale.
     *
     * If `formatString` matches with `dateString` but does not provides tokens, `referenceDate` will be returned.
     *
     * If parsing failed, `Invalid Date` will be returned.
     * Invalid Date is a Date, whose time value is NaN.
     * Time value of Date: http://es5.github.io/#x15.9.1.1
     *
     * ### v2.0.0 breaking changes:
     *
     * - [Changes that are common for the whole library](https://github.com/date-fns/date-fns/blob/master/docs/upgradeGuide.md#Common-Changes).
     *
     * - Old `parse` was renamed to `toDate`.
     *   Now `parse` is a new function which parses a string using a provided format.
     *
     *   ```javascript
     *   // Before v2.0.0
     *   parse('2016-01-01')
     *
     *   // v2.0.0 onward (toDate no longer accepts a string)
     *   toDate(1392098430000) // Unix to timestamp
     *   toDate(new Date(2014, 1, 11, 11, 30, 30)) // Cloning the date
     *   parse('2016-01-01', 'yyyy-MM-dd', new Date())
     *   ```
     *
     * @param {String} dateString - the string to parse
     * @param {String} formatString - the string of tokens
     * @param {Date|Number} referenceDate - defines values missing from the parsed dateString
     * @param {Object} [options] - an object with options.
     * @param {Locale} [options.locale=defaultLocale] - the locale object. See [Locale]{@link https://date-fns.org/docs/Locale}
     * @param {0|1|2|3|4|5|6} [options.weekStartsOn=0] - the index of the first day of the week (0 - Sunday)
     * @param {1|2|3|4|5|6|7} [options.firstWeekContainsDate=1] - the day of January, which is always in the first week of the year
     * @param {Boolean} [options.useAdditionalWeekYearTokens=false] - if true, allows usage of the week-numbering year tokens `YY` and `YYYY`;
     *   see: https://git.io/fxCyr
     * @param {Boolean} [options.useAdditionalDayOfYearTokens=false] - if true, allows usage of the day of year tokens `D` and `DD`;
     *   see: https://git.io/fxCyr
     * @returns {Date} the parsed date
     * @throws {TypeError} 3 arguments required
     * @throws {RangeError} `options.weekStartsOn` must be between 0 and 6
     * @throws {RangeError} `options.firstWeekContainsDate` must be between 1 and 7
     * @throws {RangeError} `options.locale` must contain `match` property
     * @throws {RangeError} use `yyyy` instead of `YYYY` for formatting years using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} use `yy` instead of `YY` for formatting years using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} use `d` instead of `D` for formatting days of the month using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} use `dd` instead of `DD` for formatting days of the month using [format provided] to the input [input provided]; see: https://git.io/fxCyr
     * @throws {RangeError} format string contains an unescaped latin alphabet character
     *
     * @example
     * // Parse 11 February 2014 from middle-endian format:
     * var result = parse('02/11/2014', 'MM/dd/yyyy', new Date())
     * //=> Tue Feb 11 2014 00:00:00
     *
     * @example
     * // Parse 28th of February in Esperanto locale in the context of 2010 year:
     * import eo from 'date-fns/locale/eo'
     * var result = parse('28-a de februaro', "do 'de' MMMM", new Date(2010, 0, 1), {
     *   locale: eo
     * })
     * //=> Sun Feb 28 2010 00:00:00
     */

    function parse(dirtyDateString, dirtyFormatString, dirtyReferenceDate, dirtyOptions) {
      requiredArgs(3, arguments);
      var dateString = String(dirtyDateString);
      var formatString = String(dirtyFormatString);
      var options = dirtyOptions || {};
      var locale = options.locale || locale$1;

      if (!locale.match) {
        throw new RangeError('locale must contain match property');
      }

      var localeFirstWeekContainsDate = locale.options && locale.options.firstWeekContainsDate;
      var defaultFirstWeekContainsDate = localeFirstWeekContainsDate == null ? 1 : toInteger(localeFirstWeekContainsDate);
      var firstWeekContainsDate = options.firstWeekContainsDate == null ? defaultFirstWeekContainsDate : toInteger(options.firstWeekContainsDate); // Test if weekStartsOn is between 1 and 7 _and_ is not NaN

      if (!(firstWeekContainsDate >= 1 && firstWeekContainsDate <= 7)) {
        throw new RangeError('firstWeekContainsDate must be between 1 and 7 inclusively');
      }

      var localeWeekStartsOn = locale.options && locale.options.weekStartsOn;
      var defaultWeekStartsOn = localeWeekStartsOn == null ? 0 : toInteger(localeWeekStartsOn);
      var weekStartsOn = options.weekStartsOn == null ? defaultWeekStartsOn : toInteger(options.weekStartsOn); // Test if weekStartsOn is between 0 and 6 _and_ is not NaN

      if (!(weekStartsOn >= 0 && weekStartsOn <= 6)) {
        throw new RangeError('weekStartsOn must be between 0 and 6 inclusively');
      }

      if (formatString === '') {
        if (dateString === '') {
          return toDate(dirtyReferenceDate);
        } else {
          return new Date(NaN);
        }
      }

      var subFnOptions = {
        firstWeekContainsDate: firstWeekContainsDate,
        weekStartsOn: weekStartsOn,
        locale: locale
      }; // If timezone isn't specified, it will be set to the system timezone

      var setters = [{
        priority: TIMEZONE_UNIT_PRIORITY,
        subPriority: -1,
        set: dateToSystemTimezone,
        index: 0
      }];
      var i;
      var tokens = formatString.match(longFormattingTokensRegExp).map(function (substring) {
        var firstCharacter = substring[0];

        if (firstCharacter === 'p' || firstCharacter === 'P') {
          var longFormatter = longFormatters[firstCharacter];
          return longFormatter(substring, locale.formatLong, subFnOptions);
        }

        return substring;
      }).join('').match(formattingTokensRegExp$1);
      var usedTokens = [];

      for (i = 0; i < tokens.length; i++) {
        var token = tokens[i];

        if (!options.useAdditionalWeekYearTokens && isProtectedWeekYearToken(token)) {
          throwProtectedError(token, formatString, dirtyDateString);
        }

        if (!options.useAdditionalDayOfYearTokens && isProtectedDayOfYearToken(token)) {
          throwProtectedError(token, formatString, dirtyDateString);
        }

        var firstCharacter = token[0];
        var parser = parsers[firstCharacter];

        if (parser) {
          var incompatibleTokens = parser.incompatibleTokens;

          if (Array.isArray(incompatibleTokens)) {
            var incompatibleToken = void 0;

            for (var _i = 0; _i < usedTokens.length; _i++) {
              var usedToken = usedTokens[_i].token;

              if (incompatibleTokens.indexOf(usedToken) !== -1 || usedToken === firstCharacter) {
                incompatibleToken = usedTokens[_i];
                break;
              }
            }

            if (incompatibleToken) {
              throw new RangeError("The format string mustn't contain `".concat(incompatibleToken.fullToken, "` and `").concat(token, "` at the same time"));
            }
          } else if (parser.incompatibleTokens === '*' && usedTokens.length) {
            throw new RangeError("The format string mustn't contain `".concat(token, "` and any other token at the same time"));
          }

          usedTokens.push({
            token: firstCharacter,
            fullToken: token
          });
          var parseResult = parser.parse(dateString, token, locale.match, subFnOptions);

          if (!parseResult) {
            return new Date(NaN);
          }

          setters.push({
            priority: parser.priority,
            subPriority: parser.subPriority || 0,
            set: parser.set,
            validate: parser.validate,
            value: parseResult.value,
            index: setters.length
          });
          dateString = parseResult.rest;
        } else {
          if (firstCharacter.match(unescapedLatinCharacterRegExp$1)) {
            throw new RangeError('Format string contains an unescaped latin alphabet character `' + firstCharacter + '`');
          } // Replace two single quote characters with one single quote character


          if (token === "''") {
            token = "'";
          } else if (firstCharacter === "'") {
            token = cleanEscapedString$1(token);
          } // Cut token from string, or, if string doesn't match the token, return Invalid Date


          if (dateString.indexOf(token) === 0) {
            dateString = dateString.slice(token.length);
          } else {
            return new Date(NaN);
          }
        }
      } // Check if the remaining input contains something other than whitespace


      if (dateString.length > 0 && notWhitespaceRegExp.test(dateString)) {
        return new Date(NaN);
      }

      var uniquePrioritySetters = setters.map(function (setter) {
        return setter.priority;
      }).sort(function (a, b) {
        return b - a;
      }).filter(function (priority, index, array) {
        return array.indexOf(priority) === index;
      }).map(function (priority) {
        return setters.filter(function (setter) {
          return setter.priority === priority;
        }).sort(function (a, b) {
          return b.subPriority - a.subPriority;
        });
      }).map(function (setterArray) {
        return setterArray[0];
      });
      var date = toDate(dirtyReferenceDate);

      if (isNaN(date)) {
        return new Date(NaN);
      } // Convert the date in system timezone to the same date in UTC+00:00 timezone.
      // This ensures that when UTC functions will be implemented, locales will be compatible with them.
      // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/37


      var utcDate = subMilliseconds(date, getTimezoneOffsetInMilliseconds(date));
      var flags = {};

      for (i = 0; i < uniquePrioritySetters.length; i++) {
        var setter = uniquePrioritySetters[i];

        if (setter.validate && !setter.validate(utcDate, setter.value, subFnOptions)) {
          return new Date(NaN);
        }

        var result = setter.set(utcDate, flags, setter.value, subFnOptions); // Result is tuple (date, flags)

        if (result[0]) {
          utcDate = result[0];
          assign(flags, result[1]); // Result is date
        } else {
          utcDate = result;
        }
      }

      return utcDate;
    }

    function dateToSystemTimezone(date, flags) {
      if (flags.timestampIsSet) {
        return date;
      }

      var convertedDate = new Date(0);
      convertedDate.setFullYear(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
      convertedDate.setHours(date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds(), date.getUTCMilliseconds());
      return convertedDate;
    }

    function cleanEscapedString$1(input) {
      return input.match(escapedStringRegExp$1)[1].replace(doubleQuoteRegExp$1, "'");
    }

    // - (\w)\1* matches any sequences of the same letter
    // - '' matches two quote characters in a row
    // - '(''|[^'])+('|$) matches anything surrounded by two quote characters ('),
    //   except a single quote symbol, which ends the sequence.
    //   Two quote characters do not end the sequence.
    //   If there is no matching single quote
    //   then the sequence will continue until the end of the string.
    // - . matches any single character unmatched by previous parts of the RegExps

    var formattingTokensRegExp = /(\w)\1*|''|'(''|[^'])+('|$)|./g;
    var escapedStringRegExp = /^'([^]*?)'?$/;
    var doubleQuoteRegExp = /''/g;
    var unescapedLatinCharacterRegExp = /[a-zA-Z]/;
    /**
     * @name lightFormat
     * @category Common Helpers
     * @summary Format the date.
     *
     * @description
     * Return the formatted date string in the given format. Unlike `format`,
     * `lightFormat` doesn't use locales and outputs date using the most popular tokens.
     *
     * > ⚠️ Please note that the `lightFormat` tokens differ from Moment.js and other libraries.
     * > See: https://git.io/fxCyr
     *
     * The characters wrapped between two single quotes characters (') are escaped.
     * Two single quotes in a row, whether inside or outside a quoted sequence, represent a 'real' single quote.
     *
     * Format of the string is based on Unicode Technical Standard #35:
     * https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     *
     * Accepted patterns:
     * | Unit                            | Pattern | Result examples                   |
     * |---------------------------------|---------|-----------------------------------|
     * | AM, PM                          | a..aaa  | AM, PM                            |
     * |                                 | aaaa    | a.m., p.m.                        |
     * |                                 | aaaaa   | a, p                              |
     * | Calendar year                   | y       | 44, 1, 1900, 2017                 |
     * |                                 | yy      | 44, 01, 00, 17                    |
     * |                                 | yyy     | 044, 001, 000, 017                |
     * |                                 | yyyy    | 0044, 0001, 1900, 2017            |
     * | Month (formatting)              | M       | 1, 2, ..., 12                     |
     * |                                 | MM      | 01, 02, ..., 12                   |
     * | Day of month                    | d       | 1, 2, ..., 31                     |
     * |                                 | dd      | 01, 02, ..., 31                   |
     * | Hour [1-12]                     | h       | 1, 2, ..., 11, 12                 |
     * |                                 | hh      | 01, 02, ..., 11, 12               |
     * | Hour [0-23]                     | H       | 0, 1, 2, ..., 23                  |
     * |                                 | HH      | 00, 01, 02, ..., 23               |
     * | Minute                          | m       | 0, 1, ..., 59                     |
     * |                                 | mm      | 00, 01, ..., 59                   |
     * | Second                          | s       | 0, 1, ..., 59                     |
     * |                                 | ss      | 00, 01, ..., 59                   |
     * | Fraction of second              | S       | 0, 1, ..., 9                      |
     * |                                 | SS      | 00, 01, ..., 99                   |
     * |                                 | SSS     | 000, 001, ..., 999                |
     * |                                 | SSSS    | ...                               |
     *
     * @param {Date|Number} date - the original date
     * @param {String} format - the string of tokens
     * @returns {String} the formatted date string
     * @throws {TypeError} 2 arguments required
     * @throws {RangeError} format string contains an unescaped latin alphabet character
     *
     * @example
     * const result = lightFormat(new Date(2014, 1, 11), 'yyyy-MM-dd')
     * //=> '2014-02-11'
     */

    function lightFormat(dirtyDate, formatStr) {
      requiredArgs(2, arguments);
      var originalDate = toDate(dirtyDate);

      if (!isValid(originalDate)) {
        throw new RangeError('Invalid time value');
      } // Convert the date in system timezone to the same date in UTC+00:00 timezone.
      // This ensures that when UTC functions will be implemented, locales will be compatible with them.
      // See an issue about UTC functions: https://github.com/date-fns/date-fns/issues/376


      var timezoneOffset = getTimezoneOffsetInMilliseconds(originalDate);
      var utcDate = subMilliseconds(originalDate, timezoneOffset);
      var tokens = formatStr.match(formattingTokensRegExp); // The only case when formattingTokensRegExp doesn't match the string is when it's empty

      if (!tokens) return '';
      var result = tokens.map(function (substring) {
        // Replace two single quote characters with one single quote character
        if (substring === "''") {
          return "'";
        }

        var firstCharacter = substring[0];

        if (firstCharacter === "'") {
          return cleanEscapedString(substring);
        }

        var formatter = formatters$1[firstCharacter];

        if (formatter) {
          return formatter(utcDate, substring);
        }

        if (firstCharacter.match(unescapedLatinCharacterRegExp)) {
          throw new RangeError('Format string contains an unescaped latin alphabet character `' + firstCharacter + '`');
        }

        return substring;
      }).join('');
      return result;
    }

    function cleanEscapedString(input) {
      var matches = input.match(escapedStringRegExp);

      if (!matches) {
        return input;
      }

      return matches[1].replace(doubleQuoteRegExp, "'");
    }

    // See issue: https://github.com/date-fns/date-fns/issues/376

    function isSameUTCWeek(dirtyDateLeft, dirtyDateRight, options) {
      requiredArgs(2, arguments);
      var dateLeftStartOfWeek = startOfUTCWeek(dirtyDateLeft, options);
      var dateRightStartOfWeek = startOfUTCWeek(dirtyDateRight, options);
      return dateLeftStartOfWeek.getTime() === dateRightStartOfWeek.getTime();
    }

    function declension(scheme, count) {
      // scheme for count=1 exists
      if (scheme.one !== undefined && count === 1) {
        return scheme.one;
      }

      var rem10 = count % 10;
      var rem100 = count % 100; // 1, 21, 31, ...

      if (rem10 === 1 && rem100 !== 11) {
        return scheme.singularNominative.replace('{{count}}', count); // 2, 3, 4, 22, 23, 24, 32 ...
      } else if (rem10 >= 2 && rem10 <= 4 && (rem100 < 10 || rem100 > 20)) {
        return scheme.singularGenitive.replace('{{count}}', count); // 5, 6, 7, 8, 9, 10, 11, ...
      } else {
        return scheme.pluralGenitive.replace('{{count}}', count);
      }
    }

    function buildLocalizeTokenFn(scheme) {
      return function (count, options) {
        if (options.addSuffix) {
          if (options.comparison > 0) {
            if (scheme.future) {
              return declension(scheme.future, count);
            } else {
              return 'через ' + declension(scheme.regular, count);
            }
          } else {
            if (scheme.past) {
              return declension(scheme.past, count);
            } else {
              return declension(scheme.regular, count) + ' назад';
            }
          }
        } else {
          return declension(scheme.regular, count);
        }
      };
    }

    var formatDistanceLocale = {
      lessThanXSeconds: buildLocalizeTokenFn({
        regular: {
          one: 'меньше секунды',
          singularNominative: 'меньше {{count}} секунды',
          singularGenitive: 'меньше {{count}} секунд',
          pluralGenitive: 'меньше {{count}} секунд'
        },
        future: {
          one: 'меньше, чем через секунду',
          singularNominative: 'меньше, чем через {{count}} секунду',
          singularGenitive: 'меньше, чем через {{count}} секунды',
          pluralGenitive: 'меньше, чем через {{count}} секунд'
        }
      }),
      xSeconds: buildLocalizeTokenFn({
        regular: {
          singularNominative: '{{count}} секунда',
          singularGenitive: '{{count}} секунды',
          pluralGenitive: '{{count}} секунд'
        },
        past: {
          singularNominative: '{{count}} секунду назад',
          singularGenitive: '{{count}} секунды назад',
          pluralGenitive: '{{count}} секунд назад'
        },
        future: {
          singularNominative: 'через {{count}} секунду',
          singularGenitive: 'через {{count}} секунды',
          pluralGenitive: 'через {{count}} секунд'
        }
      }),
      halfAMinute: function (_, options) {
        if (options.addSuffix) {
          if (options.comparison > 0) {
            return 'через полминуты';
          } else {
            return 'полминуты назад';
          }
        }

        return 'полминуты';
      },
      lessThanXMinutes: buildLocalizeTokenFn({
        regular: {
          one: 'меньше минуты',
          singularNominative: 'меньше {{count}} минуты',
          singularGenitive: 'меньше {{count}} минут',
          pluralGenitive: 'меньше {{count}} минут'
        },
        future: {
          one: 'меньше, чем через минуту',
          singularNominative: 'меньше, чем через {{count}} минуту',
          singularGenitive: 'меньше, чем через {{count}} минуты',
          pluralGenitive: 'меньше, чем через {{count}} минут'
        }
      }),
      xMinutes: buildLocalizeTokenFn({
        regular: {
          singularNominative: '{{count}} минута',
          singularGenitive: '{{count}} минуты',
          pluralGenitive: '{{count}} минут'
        },
        past: {
          singularNominative: '{{count}} минуту назад',
          singularGenitive: '{{count}} минуты назад',
          pluralGenitive: '{{count}} минут назад'
        },
        future: {
          singularNominative: 'через {{count}} минуту',
          singularGenitive: 'через {{count}} минуты',
          pluralGenitive: 'через {{count}} минут'
        }
      }),
      aboutXHours: buildLocalizeTokenFn({
        regular: {
          singularNominative: 'около {{count}} часа',
          singularGenitive: 'около {{count}} часов',
          pluralGenitive: 'около {{count}} часов'
        },
        future: {
          singularNominative: 'приблизительно через {{count}} час',
          singularGenitive: 'приблизительно через {{count}} часа',
          pluralGenitive: 'приблизительно через {{count}} часов'
        }
      }),
      xHours: buildLocalizeTokenFn({
        regular: {
          singularNominative: '{{count}} час',
          singularGenitive: '{{count}} часа',
          pluralGenitive: '{{count}} часов'
        }
      }),
      xDays: buildLocalizeTokenFn({
        regular: {
          singularNominative: '{{count}} день',
          singularGenitive: '{{count}} дня',
          pluralGenitive: '{{count}} дней'
        }
      }),
      aboutXWeeks: buildLocalizeTokenFn({
        regular: {
          singularNominative: 'около {{count}} недели',
          singularGenitive: 'около {{count}} недель',
          pluralGenitive: 'около {{count}} недель'
        },
        future: {
          singularNominative: 'приблизительно через {{count}} неделю',
          singularGenitive: 'приблизительно через {{count}} недели',
          pluralGenitive: 'приблизительно через {{count}} недель'
        }
      }),
      xWeeks: buildLocalizeTokenFn({
        regular: {
          singularNominative: '{{count}} неделя',
          singularGenitive: '{{count}} недели',
          pluralGenitive: '{{count}} недель'
        }
      }),
      aboutXMonths: buildLocalizeTokenFn({
        regular: {
          singularNominative: 'около {{count}} месяца',
          singularGenitive: 'около {{count}} месяцев',
          pluralGenitive: 'около {{count}} месяцев'
        },
        future: {
          singularNominative: 'приблизительно через {{count}} месяц',
          singularGenitive: 'приблизительно через {{count}} месяца',
          pluralGenitive: 'приблизительно через {{count}} месяцев'
        }
      }),
      xMonths: buildLocalizeTokenFn({
        regular: {
          singularNominative: '{{count}} месяц',
          singularGenitive: '{{count}} месяца',
          pluralGenitive: '{{count}} месяцев'
        }
      }),
      aboutXYears: buildLocalizeTokenFn({
        regular: {
          singularNominative: 'около {{count}} года',
          singularGenitive: 'около {{count}} лет',
          pluralGenitive: 'около {{count}} лет'
        },
        future: {
          singularNominative: 'приблизительно через {{count}} год',
          singularGenitive: 'приблизительно через {{count}} года',
          pluralGenitive: 'приблизительно через {{count}} лет'
        }
      }),
      xYears: buildLocalizeTokenFn({
        regular: {
          singularNominative: '{{count}} год',
          singularGenitive: '{{count}} года',
          pluralGenitive: '{{count}} лет'
        }
      }),
      overXYears: buildLocalizeTokenFn({
        regular: {
          singularNominative: 'больше {{count}} года',
          singularGenitive: 'больше {{count}} лет',
          pluralGenitive: 'больше {{count}} лет'
        },
        future: {
          singularNominative: 'больше, чем через {{count}} год',
          singularGenitive: 'больше, чем через {{count}} года',
          pluralGenitive: 'больше, чем через {{count}} лет'
        }
      }),
      almostXYears: buildLocalizeTokenFn({
        regular: {
          singularNominative: 'почти {{count}} год',
          singularGenitive: 'почти {{count}} года',
          pluralGenitive: 'почти {{count}} лет'
        },
        future: {
          singularNominative: 'почти через {{count}} год',
          singularGenitive: 'почти через {{count}} года',
          pluralGenitive: 'почти через {{count}} лет'
        }
      })
    };
    function formatDistance(token, count, options) {
      options = options || {};
      return formatDistanceLocale[token](count, options);
    }

    var dateFormats = {
      full: "EEEE, d MMMM y 'г.'",
      long: "d MMMM y 'г.'",
      medium: "d MMM y 'г.'",
      short: 'dd.MM.y'
    };
    var timeFormats = {
      full: 'H:mm:ss zzzz',
      long: 'H:mm:ss z',
      medium: 'H:mm:ss',
      short: 'H:mm'
    };
    var dateTimeFormats = {
      any: '{{date}}, {{time}}'
    };
    var formatLong = {
      date: buildFormatLongFn({
        formats: dateFormats,
        defaultWidth: 'full'
      }),
      time: buildFormatLongFn({
        formats: timeFormats,
        defaultWidth: 'full'
      }),
      dateTime: buildFormatLongFn({
        formats: dateTimeFormats,
        defaultWidth: 'any'
      })
    };

    var accusativeWeekdays = ['воскресенье', 'понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];

    function lastWeek(day) {
      var weekday = accusativeWeekdays[day];

      switch (day) {
        case 0:
          return "'в прошлое " + weekday + " в' p";

        case 1:
        case 2:
        case 4:
          return "'в прошлый " + weekday + " в' p";

        case 3:
        case 5:
        case 6:
          return "'в прошлую " + weekday + " в' p";
      }
    }

    function thisWeek(day) {
      var weekday = accusativeWeekdays[day];

      if (day === 2
      /* Tue */
      ) {
          return "'во " + weekday + " в' p";
        } else {
        return "'в " + weekday + " в' p";
      }
    }

    function nextWeek(day) {
      var weekday = accusativeWeekdays[day];

      switch (day) {
        case 0:
          return "'в следующее " + weekday + " в' p";

        case 1:
        case 2:
        case 4:
          return "'в следующий " + weekday + " в' p";

        case 3:
        case 5:
        case 6:
          return "'в следующую " + weekday + " в' p";
      }
    }

    var formatRelativeLocale = {
      lastWeek: function (date, baseDate, options) {
        var day = date.getUTCDay();

        if (isSameUTCWeek(date, baseDate, options)) {
          return thisWeek(day);
        } else {
          return lastWeek(day);
        }
      },
      yesterday: "'вчера в' p",
      today: "'сегодня в' p",
      tomorrow: "'завтра в' p",
      nextWeek: function (date, baseDate, options) {
        var day = date.getUTCDay();

        if (isSameUTCWeek(date, baseDate, options)) {
          return thisWeek(day);
        } else {
          return nextWeek(day);
        }
      },
      other: 'P'
    };
    function formatRelative(token, date, baseDate, options) {
      var format = formatRelativeLocale[token];

      if (typeof format === 'function') {
        return format(date, baseDate, options);
      }

      return format;
    }

    var eraValues = {
      narrow: ['до н.э.', 'н.э.'],
      abbreviated: ['до н. э.', 'н. э.'],
      wide: ['до нашей эры', 'нашей эры']
    };
    var quarterValues = {
      narrow: ['1', '2', '3', '4'],
      abbreviated: ['1-й кв.', '2-й кв.', '3-й кв.', '4-й кв.'],
      wide: ['1-й квартал', '2-й квартал', '3-й квартал', '4-й квартал']
    };
    var monthValues = {
      narrow: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'],
      abbreviated: ['янв.', 'фев.', 'март', 'апр.', 'май', 'июнь', 'июль', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
      wide: ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь']
    };
    var formattingMonthValues = {
      narrow: ['Я', 'Ф', 'М', 'А', 'М', 'И', 'И', 'А', 'С', 'О', 'Н', 'Д'],
      abbreviated: ['янв.', 'фев.', 'мар.', 'апр.', 'мая', 'июн.', 'июл.', 'авг.', 'сент.', 'окт.', 'нояб.', 'дек.'],
      wide: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
    };
    var dayValues = {
      narrow: ['В', 'П', 'В', 'С', 'Ч', 'П', 'С'],
      short: ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'],
      abbreviated: ['вск', 'пнд', 'втр', 'срд', 'чтв', 'птн', 'суб'],
      wide: ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
    };
    var dayPeriodValues = {
      narrow: {
        am: 'ДП',
        pm: 'ПП',
        midnight: 'полн.',
        noon: 'полд.',
        morning: 'утро',
        afternoon: 'день',
        evening: 'веч.',
        night: 'ночь'
      },
      abbreviated: {
        am: 'ДП',
        pm: 'ПП',
        midnight: 'полн.',
        noon: 'полд.',
        morning: 'утро',
        afternoon: 'день',
        evening: 'веч.',
        night: 'ночь'
      },
      wide: {
        am: 'ДП',
        pm: 'ПП',
        midnight: 'полночь',
        noon: 'полдень',
        morning: 'утро',
        afternoon: 'день',
        evening: 'вечер',
        night: 'ночь'
      }
    };
    var formattingDayPeriodValues = {
      narrow: {
        am: 'ДП',
        pm: 'ПП',
        midnight: 'полн.',
        noon: 'полд.',
        morning: 'утра',
        afternoon: 'дня',
        evening: 'веч.',
        night: 'ночи'
      },
      abbreviated: {
        am: 'ДП',
        pm: 'ПП',
        midnight: 'полн.',
        noon: 'полд.',
        morning: 'утра',
        afternoon: 'дня',
        evening: 'веч.',
        night: 'ночи'
      },
      wide: {
        am: 'ДП',
        pm: 'ПП',
        midnight: 'полночь',
        noon: 'полдень',
        morning: 'утра',
        afternoon: 'дня',
        evening: 'вечера',
        night: 'ночи'
      }
    };

    function ordinalNumber(dirtyNumber, dirtyOptions) {
      var options = dirtyOptions || {};
      var unit = String(options.unit);
      var suffix;

      if (unit === 'date') {
        suffix = '-е';
      } else if (unit === 'week' || unit === 'minute' || unit === 'second') {
        suffix = '-я';
      } else {
        suffix = '-й';
      }

      return dirtyNumber + suffix;
    }

    var localize = {
      ordinalNumber: ordinalNumber,
      era: buildLocalizeFn({
        values: eraValues,
        defaultWidth: 'wide'
      }),
      quarter: buildLocalizeFn({
        values: quarterValues,
        defaultWidth: 'wide',
        argumentCallback: function (quarter) {
          return Number(quarter) - 1;
        }
      }),
      month: buildLocalizeFn({
        values: monthValues,
        defaultWidth: 'wide',
        formattingValues: formattingMonthValues,
        defaultFormattingWidth: 'wide'
      }),
      day: buildLocalizeFn({
        values: dayValues,
        defaultWidth: 'wide'
      }),
      dayPeriod: buildLocalizeFn({
        values: dayPeriodValues,
        defaultWidth: 'any',
        formattingValues: formattingDayPeriodValues,
        defaultFormattingWidth: 'wide'
      })
    };

    var matchOrdinalNumberPattern = /^(\d+)(-?(е|я|й|ое|ье|ая|ья|ый|ой|ий|ый))?/i;
    var parseOrdinalNumberPattern = /\d+/i;
    var matchEraPatterns = {
      narrow: /^((до )?н\.?\s?э\.?)/i,
      abbreviated: /^((до )?н\.?\s?э\.?)/i,
      wide: /^(до нашей эры|нашей эры|наша эра)/i
    };
    var parseEraPatterns = {
      any: [/^д/i, /^н/i]
    };
    var matchQuarterPatterns = {
      narrow: /^[1234]/i,
      abbreviated: /^[1234](-?[ыои]?й?)? кв.?/i,
      wide: /^[1234](-?[ыои]?й?)? квартал/i
    };
    var parseQuarterPatterns = {
      any: [/1/i, /2/i, /3/i, /4/i]
    };
    var matchMonthPatterns = {
      narrow: /^[яфмаисонд]/i,
      abbreviated: /^(янв|фев|март?|апр|ма[йя]|июн[ья]?|июл[ья]?|авг|сент?|окт|нояб?|дек)\.?/i,
      wide: /^(январ[ья]|феврал[ья]|марта?|апрел[ья]|ма[йя]|июн[ья]|июл[ья]|августа?|сентябр[ья]|октябр[ья]|октябр[ья]|ноябр[ья]|декабр[ья])/i
    };
    var parseMonthPatterns = {
      narrow: [/^я/i, /^ф/i, /^м/i, /^а/i, /^м/i, /^и/i, /^и/i, /^а/i, /^с/i, /^о/i, /^н/i, /^я/i],
      any: [/^я/i, /^ф/i, /^мар/i, /^ап/i, /^ма[йя]/i, /^июн/i, /^июл/i, /^ав/i, /^с/i, /^о/i, /^н/i, /^д/i]
    };
    var matchDayPatterns = {
      narrow: /^[впсч]/i,
      short: /^(вс|во|пн|по|вт|ср|чт|че|пт|пя|сб|су)\.?/i,
      abbreviated: /^(вск|вос|пнд|пон|втр|вто|срд|сре|чтв|чет|птн|пят|суб).?/i,
      wide: /^(воскресень[ея]|понедельника?|вторника?|сред[аы]|четверга?|пятниц[аы]|суббот[аы])/i
    };
    var parseDayPatterns = {
      narrow: [/^в/i, /^п/i, /^в/i, /^с/i, /^ч/i, /^п/i, /^с/i],
      any: [/^в[ос]/i, /^п[он]/i, /^в/i, /^ср/i, /^ч/i, /^п[ят]/i, /^с[уб]/i]
    };
    var matchDayPeriodPatterns = {
      narrow: /^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
      abbreviated: /^([дп]п|полн\.?|полд\.?|утр[оа]|день|дня|веч\.?|ноч[ьи])/i,
      wide: /^([дп]п|полночь|полдень|утр[оа]|день|дня|вечера?|ноч[ьи])/i
    };
    var parseDayPeriodPatterns = {
      any: {
        am: /^дп/i,
        pm: /^пп/i,
        midnight: /^полн/i,
        noon: /^полд/i,
        morning: /^у/i,
        afternoon: /^д[ен]/i,
        evening: /^в/i,
        night: /^н/i
      }
    };
    var match = {
      ordinalNumber: buildMatchPatternFn({
        matchPattern: matchOrdinalNumberPattern,
        parsePattern: parseOrdinalNumberPattern,
        valueCallback: function (value) {
          return parseInt(value, 10);
        }
      }),
      era: buildMatchFn({
        matchPatterns: matchEraPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseEraPatterns,
        defaultParseWidth: 'any'
      }),
      quarter: buildMatchFn({
        matchPatterns: matchQuarterPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseQuarterPatterns,
        defaultParseWidth: 'any',
        valueCallback: function (index) {
          return index + 1;
        }
      }),
      month: buildMatchFn({
        matchPatterns: matchMonthPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseMonthPatterns,
        defaultParseWidth: 'any'
      }),
      day: buildMatchFn({
        matchPatterns: matchDayPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseDayPatterns,
        defaultParseWidth: 'any'
      }),
      dayPeriod: buildMatchFn({
        matchPatterns: matchDayPeriodPatterns,
        defaultMatchWidth: 'wide',
        parsePatterns: parseDayPeriodPatterns,
        defaultParseWidth: 'any'
      })
    };

    /**
     * @type {Locale}
     * @category Locales
     * @summary Russian locale.
     * @language Russian
     * @iso-639-2 rus
     * @author Sasha Koss [@kossnocorp]{@link https://github.com/kossnocorp}
     * @author Lesha Koss [@leshakoss]{@link https://github.com/leshakoss}
     */

    var locale = {
      code: 'ru',
      formatDistance: formatDistance,
      formatLong: formatLong,
      formatRelative: formatRelative,
      localize: localize,
      match: match,
      options: {
        weekStartsOn: 1
        /* Monday */
        ,
        firstWeekContainsDate: 1
      }
    };

    var css_248z$9 = "";
    styleInject(css_248z$9);

    /* src/Comps/period.svelte generated by Svelte v3.38.3 */
    const file$d = "src/Comps/period.svelte";

    // (102:12) {#if !errMessage}
    function create_if_block_1$4(ctx) {
    	let div;
    	let button;
    	let span0;
    	let fa;
    	let t0;
    	let span1;
    	let button_disabled_value;
    	let current;
    	let mounted;
    	let dispose;

    	fa = new Fa({
    			props: { icon: faSync, size: "1.5x" },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			span0 = element("span");
    			create_component(fa.$$.fragment);
    			t0 = space();
    			span1 = element("span");
    			span1.textContent = "Обновить";
    			attr_dev(span0, "class", "icon");
    			add_location(span0, file$d, 110, 24, 3533);
    			add_location(span1, file$d, 114, 24, 3671);
    			attr_dev(button, "class", "button is-small is-info  svelte-ha5gs8");

    			button.disabled = button_disabled_value = /*errMessage*/ ctx[2] || !/*$depart_id*/ ctx[3] || !/*$teacher_id*/ ctx[4]
    			? true
    			: false;

    			add_location(button, file$d, 103, 20, 3219);
    			set_style(div, "padding", "5px 0");
    			add_location(div, file$d, 102, 16, 3171);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			append_dev(button, span0);
    			mount_component(fa, span0, null);
    			append_dev(button, t0);
    			append_dev(button, span1);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*errMessage, $depart_id, $teacher_id*/ 28 && button_disabled_value !== (button_disabled_value = /*errMessage*/ ctx[2] || !/*$depart_id*/ ctx[3] || !/*$teacher_id*/ ctx[4]
    			? true
    			: false)) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(fa);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(102:12) {#if !errMessage}",
    		ctx
    	});

    	return block;
    }

    // (122:8) {#if errMessage}
    function create_if_block$6(ctx) {
    	let span;
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(/*errMessage*/ ctx[2]);
    			attr_dev(span, "class", "errmessage svelte-ha5gs8");
    			add_location(span, file$d, 122, 12, 3855);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*errMessage*/ 4) set_data_dev(t, /*errMessage*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(122:8) {#if errMessage}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$d(ctx) {
    	let div8;
    	let div6;
    	let div2;
    	let div0;
    	let t1;
    	let div1;
    	let input0;
    	let t2;
    	let div5;
    	let div3;
    	let t4;
    	let div4;
    	let input1;
    	let t5;
    	let t6;
    	let div7;
    	let current;
    	let mounted;
    	let dispose;
    	let if_block0 = !/*errMessage*/ ctx[2] && create_if_block_1$4(ctx);
    	let if_block1 = /*errMessage*/ ctx[2] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			div8 = element("div");
    			div6 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Начало периода:";
    			t1 = space();
    			div1 = element("div");
    			input0 = element("input");
    			t2 = space();
    			div5 = element("div");
    			div3 = element("div");
    			div3.textContent = "Конец периода:";
    			t4 = space();
    			div4 = element("div");
    			input1 = element("input");
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			div7 = element("div");
    			if (if_block1) if_block1.c();
    			attr_dev(div0, "class", "calendar-txt svelte-ha5gs8");
    			add_location(div0, file$d, 73, 12, 2214);
    			attr_dev(input0, "type", "date");
    			attr_dev(input0, "min", /*frmMinStartDate*/ ctx[5]);
    			attr_dev(input0, "max", /*frmMaxStartDate*/ ctx[6]);
    			input0.required = true;
    			attr_dev(input0, "class", "input is-success svelte-ha5gs8");
    			add_location(input0, file$d, 75, 16, 2296);
    			add_location(div1, file$d, 74, 12, 2274);
    			add_location(div2, file$d, 71, 8, 2110);
    			attr_dev(div3, "class", "calendar-txt svelte-ha5gs8");
    			add_location(div3, file$d, 88, 12, 2715);
    			attr_dev(input1, "type", "date");
    			attr_dev(input1, "min", /*frmMinEndDate*/ ctx[7]);
    			attr_dev(input1, "max", /*frmMaxEndDate*/ ctx[8]);
    			input1.required = true;
    			attr_dev(input1, "class", "input is-success svelte-ha5gs8");
    			add_location(input1, file$d, 90, 16, 2796);
    			add_location(div4, file$d, 89, 12, 2774);
    			add_location(div5, file$d, 87, 8, 2697);
    			attr_dev(div6, "class", "calendar-inputs svelte-ha5gs8");
    			add_location(div6, file$d, 70, 4, 2072);
    			attr_dev(div7, "class", "error-row svelte-ha5gs8");
    			add_location(div7, file$d, 120, 4, 3794);
    			attr_dev(div8, "class", "calendar-wrapper svelte-ha5gs8");
    			add_location(div8, file$d, 67, 0, 1993);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div8, anchor);
    			append_dev(div8, div6);
    			append_dev(div6, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			set_input_value(input0, /*frmStartDate*/ ctx[0]);
    			append_dev(div6, t2);
    			append_dev(div6, div5);
    			append_dev(div5, div3);
    			append_dev(div5, t4);
    			append_dev(div5, div4);
    			append_dev(div4, input1);
    			set_input_value(input1, /*frmEndDate*/ ctx[1]);
    			append_dev(div5, t5);
    			if (if_block0) if_block0.m(div5, null);
    			append_dev(div8, t6);
    			append_dev(div8, div7);
    			if (if_block1) if_block1.m(div7, null);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[10], false, false, false),
    					listen_dev(input0, "input", /*input0_input_handler*/ ctx[11]),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[12], false, false, false),
    					listen_dev(input1, "input", /*input1_input_handler*/ ctx[13])
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*frmStartDate*/ 1) {
    				set_input_value(input0, /*frmStartDate*/ ctx[0]);
    			}

    			if (dirty & /*frmEndDate*/ 2) {
    				set_input_value(input1, /*frmEndDate*/ ctx[1]);
    			}

    			if (!/*errMessage*/ ctx[2]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*errMessage*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_1$4(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div5, null);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*errMessage*/ ctx[2]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$6(ctx);
    					if_block1.c();
    					if_block1.m(div7, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div8);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$d.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$d($$self, $$props, $$invalidate) {
    	let $depart_id;
    	let $teacher_id;
    	validate_store(depart_id, "depart_id");
    	component_subscribe($$self, depart_id, $$value => $$invalidate(3, $depart_id = $$value));
    	validate_store(teacher_id, "teacher_id");
    	component_subscribe($$self, teacher_id, $$value => $$invalidate(4, $teacher_id = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Period", slots, []);

    	const formatDate = d => {
    		let frm = "yyyy-MM-dd";

    		if (d) {
    			return format(d, frm);
    		} else {
    			return format(new Date(), frm);
    		}
    	};

    	let currdate = new Date();
    	let startDate = currdate.setDate(1); //1-й день тек. мес.
    	let frmStartDate = formatDate(startDate);
    	let frmMinStartDate = formatDate(currdate.setDate(1)); //formatDate(add(currdate.setDate(1), { months: -1 }));
    	let frmMaxStartDate = formatDate(lastDayOfMonth(currdate)); //formatDate(add(currdate.setDate(1), { months: 2 }));
    	let endDate = currdate.setDate(lastDayOfMonth(currdate).getDate()); //посл. день тек. мес.
    	let frmEndDate = formatDate(endDate);
    	let frmMinEndDate = formatDate(currdate.setDate(2));
    	let frmMaxEndDate = formatDate(add(lastDayOfMonth(currdate), { months: 2 }));
    	let errMessage = "";

    	//endDate д.б. не больше выбранной startDate
    	const compareDates = () => {
    		if (new Date(frmEndDate) < new Date(frmStartDate)) {
    			$$invalidate(1, frmEndDate = frmStartDate);
    			return;
    		}

    		if (new Date(frmEndDate) > new Date(frmMaxEndDate)) {
    			$$invalidate(1, frmEndDate = frmMaxEndDate);
    			return;
    		}

    		if (!frmStartDate || !frmEndDate) {
    			$$invalidate(2, errMessage = "Установите даты периода");
    			return;
    		} else {
    			$$invalidate(2, errMessage = "");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Period> was created with unknown prop '${key}'`);
    	});

    	const change_handler = () => compareDates();

    	function input0_input_handler() {
    		frmStartDate = this.value;
    		$$invalidate(0, frmStartDate);
    	}

    	const change_handler_1 = () => compareDates();

    	function input1_input_handler() {
    		frmEndDate = this.value;
    		$$invalidate(1, frmEndDate);
    	}

    	const click_handler = () => getSched();

    	$$self.$capture_state = () => ({
    		depart_id,
    		teacher_id,
    		d_start,
    		d_end,
    		getSched,
    		add,
    		lastDayOfMonth,
    		format,
    		ru: locale,
    		Fa,
    		faSync,
    		formatDate,
    		currdate,
    		startDate,
    		frmStartDate,
    		frmMinStartDate,
    		frmMaxStartDate,
    		endDate,
    		frmEndDate,
    		frmMinEndDate,
    		frmMaxEndDate,
    		errMessage,
    		compareDates,
    		$depart_id,
    		$teacher_id
    	});

    	$$self.$inject_state = $$props => {
    		if ("currdate" in $$props) currdate = $$props.currdate;
    		if ("startDate" in $$props) startDate = $$props.startDate;
    		if ("frmStartDate" in $$props) $$invalidate(0, frmStartDate = $$props.frmStartDate);
    		if ("frmMinStartDate" in $$props) $$invalidate(5, frmMinStartDate = $$props.frmMinStartDate);
    		if ("frmMaxStartDate" in $$props) $$invalidate(6, frmMaxStartDate = $$props.frmMaxStartDate);
    		if ("endDate" in $$props) endDate = $$props.endDate;
    		if ("frmEndDate" in $$props) $$invalidate(1, frmEndDate = $$props.frmEndDate);
    		if ("frmMinEndDate" in $$props) $$invalidate(7, frmMinEndDate = $$props.frmMinEndDate);
    		if ("frmMaxEndDate" in $$props) $$invalidate(8, frmMaxEndDate = $$props.frmMaxEndDate);
    		if ("errMessage" in $$props) $$invalidate(2, errMessage = $$props.errMessage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*frmStartDate*/ 1) {
    			//привязка store-writable переменных к значениям input'ов
    			d_start.update(() => frmStartDate);
    		}

    		if ($$self.$$.dirty & /*frmEndDate*/ 2) {
    			d_end.update(() => frmEndDate);
    		}
    	};

    	return [
    		frmStartDate,
    		frmEndDate,
    		errMessage,
    		$depart_id,
    		$teacher_id,
    		frmMinStartDate,
    		frmMaxStartDate,
    		frmMinEndDate,
    		frmMaxEndDate,
    		compareDates,
    		change_handler,
    		input0_input_handler,
    		change_handler_1,
    		input1_input_handler,
    		click_handler
    	];
    }

    class Period extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$d, create_fragment$d, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Period",
    			options,
    			id: create_fragment$d.name
    		});
    	}
    }

    var css_248z$8 = "";
    styleInject(css_248z$8);

    /* src/Comps/depart.svelte generated by Svelte v3.38.3 */
    const file$c = "src/Comps/depart.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	return child_ctx;
    }

    // (41:10) {#if $data.Departs}
    function create_if_block_1$3(ctx) {
    	let each_1_anchor;
    	let each_value_1 = /*$data*/ ctx[2].Departs;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 4) {
    				each_value_1 = /*$data*/ ctx[2].Departs;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
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
    		source: "(41:10) {#if $data.Departs}",
    		ctx
    	});

    	return block;
    }

    // (42:12) {#each $data.Departs as item}
    function create_each_block_1$2(ctx) {
    	let option;
    	let t0_value = /*item*/ ctx[14].DepartName + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*item*/ ctx[14].Depart_ID;
    			option.value = option.__value;
    			add_location(option, file$c, 42, 14, 1061);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data*/ 4 && t0_value !== (t0_value = /*item*/ ctx[14].DepartName + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$data*/ 4 && option_value_value !== (option_value_value = /*item*/ ctx[14].Depart_ID)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(42:12) {#each $data.Departs as item}",
    		ctx
    	});

    	return block;
    }

    // (63:10) {#if $data.Teachers}
    function create_if_block$5(ctx) {
    	let each_1_anchor;
    	let each_value = /*$data*/ ctx[2].Teachers.filter(/*func*/ ctx[9]);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data, selDep_ID*/ 5) {
    				each_value = /*$data*/ ctx[2].Teachers.filter(/*func*/ ctx[9]);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
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
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(63:10) {#if $data.Teachers}",
    		ctx
    	});

    	return block;
    }

    // (64:12) {#each $data.Teachers.filter((t) => t.Depart_ID == selDep_ID) as item}
    function create_each_block$2(ctx) {
    	let option;
    	let t0_value = /*item*/ ctx[14].FIO + "";
    	let t0;
    	let t1;
    	let option_value_value;

    	const block = {
    		c: function create() {
    			option = element("option");
    			t0 = text(t0_value);
    			t1 = space();
    			option.__value = option_value_value = /*item*/ ctx[14].Emp_ID;
    			option.value = option.__value;
    			add_location(option, file$c, 64, 14, 1719);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t0);
    			append_dev(option, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$data, selDep_ID*/ 5 && t0_value !== (t0_value = /*item*/ ctx[14].FIO + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$data, selDep_ID*/ 5 && option_value_value !== (option_value_value = /*item*/ ctx[14].Emp_ID)) {
    				prop_dev(option, "__value", option_value_value);
    				option.value = option.__value;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(64:12) {#each $data.Teachers.filter((t) => t.Depart_ID == selDep_ID) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$c(ctx) {
    	let div6;
    	let div2;
    	let label0;
    	let t1;
    	let div1;
    	let div0;
    	let select0;
    	let option0;
    	let t3;
    	let div5;
    	let label1;
    	let t5;
    	let div4;
    	let div3;
    	let select1;
    	let option1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*$data*/ ctx[2].Departs && create_if_block_1$3(ctx);
    	let if_block1 = /*$data*/ ctx[2].Teachers && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			div6 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "Кафедра:";
    			t1 = space();
    			div1 = element("div");
    			div0 = element("div");
    			select0 = element("select");
    			option0 = element("option");
    			option0.textContent = "Выберите кафедру";
    			if (if_block0) if_block0.c();
    			t3 = space();
    			div5 = element("div");
    			label1 = element("label");
    			label1.textContent = "Преподаватель:";
    			t5 = space();
    			div4 = element("div");
    			div3 = element("div");
    			select1 = element("select");
    			option1 = element("option");
    			option1.textContent = "Выберите преподавателя";
    			if (if_block1) if_block1.c();
    			attr_dev(label0, "class", "label svelte-98ektz");
    			add_location(label0, file$c, 31, 4, 663);
    			option0.__value = "null";
    			option0.value = option0.__value;
    			option0.selected = true;
    			option0.disabled = true;
    			add_location(option0, file$c, 39, 10, 910);
    			attr_dev(select0, "class", "svelte-98ektz");
    			if (/*selDep_ID*/ ctx[0] === void 0) add_render_callback(() => /*select0_change_handler*/ ctx[7].call(select0));
    			add_location(select0, file$c, 34, 8, 773);
    			attr_dev(div0, "class", "select is-success svelte-98ektz");
    			add_location(div0, file$c, 33, 6, 733);
    			attr_dev(div1, "class", "control");
    			add_location(div1, file$c, 32, 4, 705);
    			attr_dev(div2, "class", "field svelte-98ektz");
    			add_location(div2, file$c, 30, 2, 639);
    			attr_dev(label1, "class", "label svelte-98ektz");
    			add_location(label1, file$c, 53, 4, 1265);
    			option1.__value = "null";
    			option1.value = option1.__value;
    			option1.selected = true;
    			option1.disabled = true;
    			add_location(option1, file$c, 61, 10, 1520);
    			attr_dev(select1, "class", "svelte-98ektz");
    			if (/*selTchr_ID*/ ctx[1] === void 0) add_render_callback(() => /*select1_change_handler*/ ctx[10].call(select1));
    			add_location(select1, file$c, 56, 8, 1381);
    			attr_dev(div3, "class", "select is-success svelte-98ektz");
    			add_location(div3, file$c, 55, 6, 1341);
    			attr_dev(div4, "class", "control");
    			add_location(div4, file$c, 54, 4, 1313);
    			attr_dev(div5, "class", "field svelte-98ektz");
    			add_location(div5, file$c, 52, 2, 1241);
    			add_location(div6, file$c, 28, 0, 606);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div6, anchor);
    			append_dev(div6, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t1);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, select0);
    			append_dev(select0, option0);
    			if (if_block0) if_block0.m(select0, null);
    			select_option(select0, /*selDep_ID*/ ctx[0]);
    			append_dev(div6, t3);
    			append_dev(div6, div5);
    			append_dev(div5, label1);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, select1);
    			append_dev(select1, option1);
    			if (if_block1) if_block1.m(select1, null);
    			select_option(select1, /*selTchr_ID*/ ctx[1]);

    			if (!mounted) {
    				dispose = [
    					listen_dev(select0, "change", /*select0_change_handler*/ ctx[7]),
    					listen_dev(select0, "change", /*change_handler*/ ctx[8], false, false, false),
    					listen_dev(select0, "blur", undefined, false, false, false),
    					listen_dev(select1, "change", /*select1_change_handler*/ ctx[10]),
    					listen_dev(select1, "change", /*change_handler_1*/ ctx[11], false, false, false),
    					listen_dev(select1, "blur", undefined, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$data*/ ctx[2].Departs) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$3(ctx);
    					if_block0.c();
    					if_block0.m(select0, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*selDep_ID, $data*/ 5) {
    				select_option(select0, /*selDep_ID*/ ctx[0]);
    			}

    			if (/*$data*/ ctx[2].Teachers) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$5(ctx);
    					if_block1.c();
    					if_block1.m(select1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*selTchr_ID, $data, selDep_ID*/ 7) {
    				select_option(select1, /*selTchr_ID*/ ctx[1]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div6);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$c.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$c($$self, $$props, $$invalidate) {
    	let $data;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Depart", slots, []);
    	let { state_drawer } = $$props;
    	let selDep_ID;
    	let selTchr_ID;
    	const [loading, error, data] = departData();
    	validate_store(data, "data");
    	component_subscribe($$self, data, value => $$invalidate(2, $data = value));

    	const onDepSelected = e => {
    		depart_id.update(() => e.target.value);
    		teacher_id.update(() => null);
    		$$invalidate(1, selTchr_ID = "null"); //Установим преп-ля в placeholder
    	};

    	const onTchrSelected = e => {
    		teacher_id.update(() => e.target.value);
    		getSched();

    		setTimeout(
    			() => {
    				state_drawer();
    			},
    			500
    		);
    	};

    	const writable_props = ["state_drawer"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Depart> was created with unknown prop '${key}'`);
    	});

    	function select0_change_handler() {
    		selDep_ID = select_value(this);
    		$$invalidate(0, selDep_ID);
    	}

    	const change_handler = v => onDepSelected(v);
    	const func = t => t.Depart_ID == selDep_ID;

    	function select1_change_handler() {
    		selTchr_ID = select_value(this);
    		$$invalidate(1, selTchr_ID);
    		$$invalidate(0, selDep_ID);
    	}

    	const change_handler_1 = v => onTchrSelected(v);

    	$$self.$$set = $$props => {
    		if ("state_drawer" in $$props) $$invalidate(6, state_drawer = $$props.state_drawer);
    	};

    	$$self.$capture_state = () => ({
    		departData,
    		depart_id,
    		teacher_id,
    		getSched,
    		state_drawer,
    		selDep_ID,
    		selTchr_ID,
    		loading,
    		error,
    		data,
    		onDepSelected,
    		onTchrSelected,
    		$data
    	});

    	$$self.$inject_state = $$props => {
    		if ("state_drawer" in $$props) $$invalidate(6, state_drawer = $$props.state_drawer);
    		if ("selDep_ID" in $$props) $$invalidate(0, selDep_ID = $$props.selDep_ID);
    		if ("selTchr_ID" in $$props) $$invalidate(1, selTchr_ID = $$props.selTchr_ID);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		selDep_ID,
    		selTchr_ID,
    		$data,
    		data,
    		onDepSelected,
    		onTchrSelected,
    		state_drawer,
    		select0_change_handler,
    		change_handler,
    		func,
    		select1_change_handler,
    		change_handler_1
    	];
    }

    class Depart extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$c, safe_not_equal, { state_drawer: 6 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Depart",
    			options,
    			id: create_fragment$c.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*state_drawer*/ ctx[6] === undefined && !("state_drawer" in props)) {
    			console.warn("<Depart> was created without expected prop 'state_drawer'");
    		}
    	}

    	get state_drawer() {
    		throw new Error("<Depart>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set state_drawer(value) {
    		throw new Error("<Depart>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var css_248z$7 = "";
    styleInject(css_248z$7);

    /* src/Comps/noschedule.svelte generated by Svelte v3.38.3 */
    const file$b = "src/Comps/noschedule.svelte";

    function create_fragment$b(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t0;
    	let br0;
    	let t1;
    	let br1;
    	let t2;
    	let t3_value = new Date(/*$d_start*/ ctx[0]).toLocaleDateString("ru-RU") + "";
    	let t3;
    	let t4;
    	let t5_value = new Date(/*$d_end*/ ctx[1]).toLocaleDateString("ru-RU") + "";
    	let t5;
    	let t6;
    	let br2;
    	let t7;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text("Расписание\n            ");
    			br0 = element("br");
    			t1 = text("\n            на период\n            ");
    			br1 = element("br");
    			t2 = space();
    			t3 = text(t3_value);
    			t4 = text("-");
    			t5 = text(t5_value);
    			t6 = space();
    			br2 = element("br");
    			t7 = text("\n            не составлено");
    			add_location(br0, file$b, 8, 12, 196);
    			add_location(br1, file$b, 10, 12, 237);
    			add_location(br2, file$b, 14, 12, 394);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$b, 6, 8, 139);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$b, 5, 4, 104);
    			attr_dev(div2, "class", "card no-schedule svelte-s8v2qq");
    			add_location(div2, file$b, 4, 0, 69);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div0, br0);
    			append_dev(div0, t1);
    			append_dev(div0, br1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div0, t5);
    			append_dev(div0, t6);
    			append_dev(div0, br2);
    			append_dev(div0, t7);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$d_start*/ 1 && t3_value !== (t3_value = new Date(/*$d_start*/ ctx[0]).toLocaleDateString("ru-RU") + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*$d_end*/ 2 && t5_value !== (t5_value = new Date(/*$d_end*/ ctx[1]).toLocaleDateString("ru-RU") + "")) set_data_dev(t5, t5_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	let $d_start;
    	let $d_end;
    	validate_store(d_start, "d_start");
    	component_subscribe($$self, d_start, $$value => $$invalidate(0, $d_start = $$value));
    	validate_store(d_end, "d_end");
    	component_subscribe($$self, d_end, $$value => $$invalidate(1, $d_end = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Noschedule", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Noschedule> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ d_start, d_end, $d_start, $d_end });
    	return [$d_start, $d_end];
    }

    class Noschedule extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Noschedule",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const isToday = ( pairdate)=>{
        const today = intlFormat(new Date(), { locale: "ru-RU" });
        return  pairdate ===today
    };

    const toEnDate=(pairdate)=>{
       let en= parse(pairdate, 'dd.MM.yyyy', new Date()); 
       return lightFormat(en, 'yyyy-MM-dd')
    };

    var css_248z$6 = "";
    styleInject(css_248z$6);

    /* src/Comps/schedule.svelte generated by Svelte v3.38.3 */

    const { Object: Object_1$1 } = globals;
    const file$a = "src/Comps/schedule.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[10] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (83:29) 
    function create_if_block_3$1(ctx) {
    	let noschedule;
    	let current;
    	noschedule = new Noschedule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(noschedule.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(noschedule, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(noschedule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(noschedule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(noschedule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3$1.name,
    		type: "if",
    		source: "(83:29) ",
    		ctx
    	});

    	return block;
    }

    // (21:0) {#if Object.keys($scheddata).length}
    function create_if_block$4(ctx) {
    	let div;
    	let current;
    	let each_value = /*$scheddata*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "container ");
    			set_style(div, "margin-top", "10px");
    			add_location(div, file$a, 21, 4, 640);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scheddata, toEnDate, isToday, shows, PairCount*/ 11) {
    				each_value = /*$scheddata*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(21:0) {#if Object.keys($scheddata).length}",
    		ctx
    	});

    	return block;
    }

    // (35:12) {#if shows[i]}
    function create_if_block_1$2(ctx) {
    	let div;
    	let t;
    	let div_intro;
    	let div_outro;
    	let current;
    	let each_value_1 = /*month*/ ctx[5].DateDay;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			add_location(div, file$a, 35, 16, 1197);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scheddata, toEnDate, isToday*/ 2) {
    				each_value_1 = /*month*/ ctx[5].DateDay;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fade, { duration: 1000 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(35:12) {#if shows[i]}",
    		ctx
    	});

    	return block;
    }

    // (51:28) {#if isToday(day.DatePair)}
    function create_if_block_2$2(ctx) {
    	let span;

    	const block = {
    		c: function create() {
    			span = element("span");
    			span.textContent = "Сегодня";
    			attr_dev(span, "class", "today-lbl svelte-1xko03a");
    			add_location(span, file$a, 51, 32, 1950);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$2.name,
    		type: "if",
    		source: "(51:28) {#if isToday(day.DatePair)}",
    		ctx
    	});

    	return block;
    }

    // (55:24) {#each day.Schedule as pair, i}
    function create_each_block_2$1(ctx) {
    	let div5;
    	let div0;
    	let t0_value = /*pair*/ ctx[10].TimeStart + "";
    	let t0;
    	let t1;
    	let div1;
    	let span0;
    	let t2_value = /*pair*/ ctx[10].SubjName + "";
    	let t2;
    	let t3;
    	let div2;
    	let span1;
    	let t4_value = /*pair*/ ctx[10].LoadKindSN + "";
    	let t4;
    	let t5;
    	let div3;
    	let span2;
    	let t6_value = /*pair*/ ctx[10].GSName + "";
    	let t6;
    	let t7;
    	let div4;
    	let t8_value = /*pair*/ ctx[10].Aud + "";
    	let t8;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div1 = element("div");
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			span1 = element("span");
    			t4 = text(t4_value);
    			t5 = space();
    			div3 = element("div");
    			span2 = element("span");
    			t6 = text(t6_value);
    			t7 = space();
    			div4 = element("div");
    			t8 = text(t8_value);
    			attr_dev(div0, "class", "time-start svelte-1xko03a");
    			add_location(div0, file$a, 56, 32, 2197);
    			attr_dev(span0, "class", "svelte-1xko03a");
    			add_location(span0, file$a, 60, 36, 2406);
    			attr_dev(div1, "class", "subj-name svelte-1xko03a");
    			add_location(div1, file$a, 59, 32, 2346);
    			attr_dev(span1, "class", "svelte-1xko03a");
    			add_location(span1, file$a, 63, 36, 2563);
    			attr_dev(div2, "class", "kind svelte-1xko03a");
    			add_location(div2, file$a, 62, 32, 2508);
    			attr_dev(span2, "class", "svelte-1xko03a");
    			add_location(span2, file$a, 68, 36, 2799);
    			attr_dev(div3, "class", "group svelte-1xko03a");
    			add_location(div3, file$a, 67, 32, 2743);
    			attr_dev(div4, "class", "aud svelte-1xko03a");
    			add_location(div4, file$a, 72, 32, 2975);
    			attr_dev(div5, "class", "pair-wrapper svelte-1xko03a");
    			add_location(div5, file$a, 55, 28, 2138);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div1);
    			append_dev(div1, span0);
    			append_dev(span0, t2);
    			append_dev(div5, t3);
    			append_dev(div5, div2);
    			append_dev(div2, span1);
    			append_dev(span1, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div3);
    			append_dev(div3, span2);
    			append_dev(span2, t6);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scheddata*/ 2 && t0_value !== (t0_value = /*pair*/ ctx[10].TimeStart + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$scheddata*/ 2 && t2_value !== (t2_value = /*pair*/ ctx[10].SubjName + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$scheddata*/ 2 && t4_value !== (t4_value = /*pair*/ ctx[10].LoadKindSN + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$scheddata*/ 2 && t6_value !== (t6_value = /*pair*/ ctx[10].GSName + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*$scheddata*/ 2 && t8_value !== (t8_value = /*pair*/ ctx[10].Aud + "")) set_data_dev(t8, t8_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(55:24) {#each day.Schedule as pair, i}",
    		ctx
    	});

    	return block;
    }

    // (37:20) {#each month.DateDay as day, i}
    function create_each_block_1$1(ctx) {
    	let div;
    	let span1;
    	let t0_value = /*day*/ ctx[8].DatePair + "";
    	let t0;
    	let t1;
    	let span0;
    	let t2_value = /*day*/ ctx[8].DayWeek + "";
    	let t2;
    	let t3;
    	let show_if = isToday(/*day*/ ctx[8].DatePair);
    	let div_id_value;
    	let div_class_value;
    	let t4;
    	let each_1_anchor;
    	let if_block = show_if && create_if_block_2$2(ctx);
    	let each_value_2 = /*day*/ ctx[8].Schedule;
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			span1 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span0 = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			if (if_block) if_block.c();
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			set_style(span0, "margin-left", "10px");
    			add_location(span0, file$a, 45, 32, 1702);
    			add_location(span1, file$a, 43, 28, 1616);
    			attr_dev(div, "id", div_id_value = toEnDate(/*day*/ ctx[8].DatePair));
    			attr_dev(div, "class", div_class_value = "day " + (/*day*/ ctx[8].DayWeek == "Суббота" ? "sbt" : "") + "  " + (isToday(/*day*/ ctx[8].DatePair) ? "today" : "") + " svelte-1xko03a");
    			add_location(div, file$a, 37, 24, 1317);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span1);
    			append_dev(span1, t0);
    			append_dev(span1, t1);
    			append_dev(span1, span0);
    			append_dev(span0, t2);
    			append_dev(div, t3);
    			if (if_block) if_block.m(div, null);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scheddata*/ 2 && t0_value !== (t0_value = /*day*/ ctx[8].DatePair + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$scheddata*/ 2 && t2_value !== (t2_value = /*day*/ ctx[8].DayWeek + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$scheddata*/ 2) show_if = isToday(/*day*/ ctx[8].DatePair);

    			if (show_if) {
    				if (if_block) ; else {
    					if_block = create_if_block_2$2(ctx);
    					if_block.c();
    					if_block.m(div, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*$scheddata*/ 2 && div_id_value !== (div_id_value = toEnDate(/*day*/ ctx[8].DatePair))) {
    				attr_dev(div, "id", div_id_value);
    			}

    			if (dirty & /*$scheddata*/ 2 && div_class_value !== (div_class_value = "day " + (/*day*/ ctx[8].DayWeek == "Суббота" ? "sbt" : "") + "  " + (isToday(/*day*/ ctx[8].DatePair) ? "today" : "") + " svelte-1xko03a")) {
    				attr_dev(div, "class", div_class_value);
    			}

    			if (dirty & /*$scheddata*/ 2) {
    				each_value_2 = /*day*/ ctx[8].Schedule;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(37:20) {#each month.DateDay as day, i}",
    		ctx
    	});

    	return block;
    }

    // (23:8) {#each $scheddata as month, i}
    function create_each_block$1(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*month*/ ctx[5].Month + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*PairCount*/ ctx[3](/*month*/ ctx[5].DateDay) + "";
    	let t2;
    	let t3;
    	let t4_value = /*month*/ ctx[5].DateDay.length + "";
    	let t4;
    	let t5;
    	let t6;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*i*/ ctx[7]);
    	}

    	let if_block = /*shows*/ ctx[0][/*i*/ ctx[7]] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = text(" пар; ");
    			t4 = text(t4_value);
    			t5 = text(" дней");
    			t6 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span0, "class", "svelte-1xko03a");
    			add_location(span0, file$a, 28, 16, 896);
    			attr_dev(span1, "class", "svelte-1xko03a");
    			add_location(span1, file$a, 29, 16, 940);
    			attr_dev(div, "id", /*i*/ ctx[7] + "-month");
    			attr_dev(div, "class", "month svelte-1xko03a");
    			add_location(div, file$a, 23, 12, 741);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			insert_dev(target, t6, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*$scheddata*/ 2) && t0_value !== (t0_value = /*month*/ ctx[5].Month + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$scheddata*/ 2) && t2_value !== (t2_value = /*PairCount*/ ctx[3](/*month*/ ctx[5].DateDay) + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*$scheddata*/ 2) && t4_value !== (t4_value = /*month*/ ctx[5].DateDay.length + "")) set_data_dev(t4, t4_value);

    			if (/*shows*/ ctx[0][/*i*/ ctx[7]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*shows*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t6);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(23:8) {#each $scheddata as month, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let show_if;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$4, create_if_block_3$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (dirty & /*$scheddata*/ 2) show_if = !!Object.keys(/*$scheddata*/ ctx[1]).length;
    		if (show_if) return 0;
    		if (/*$sched_data_loaded*/ ctx[2]) return 1;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx, -1))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].m(target, anchor);
    			}

    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx, dirty);

    			if (current_block_type_index === previous_block_index) {
    				if (~current_block_type_index) {
    					if_blocks[current_block_type_index].p(ctx, dirty);
    				}
    			} else {
    				if (if_block) {
    					group_outros();

    					transition_out(if_blocks[previous_block_index], 1, 1, () => {
    						if_blocks[previous_block_index] = null;
    					});

    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];

    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					} else {
    						if_block.p(ctx, dirty);
    					}

    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				} else {
    					if_block = null;
    				}
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
    			if (~current_block_type_index) {
    				if_blocks[current_block_type_index].d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
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
    	let $scheddata;
    	let $sched_data_loaded;
    	validate_store(scheddata, "scheddata");
    	component_subscribe($$self, scheddata, $$value => $$invalidate(1, $scheddata = $$value));
    	validate_store(sched_data_loaded, "sched_data_loaded");
    	component_subscribe($$self, sched_data_loaded, $$value => $$invalidate(2, $sched_data_loaded = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Schedule", slots, []);

    	const PairCount = daysArr => {
    		//считает кол-во пар в мес.
    		let pcount = 0;

    		daysArr.forEach(day => {
    			pcount += day["Schedule"].length;
    		});

    		return pcount;
    	};

    	let shows = Array($scheddata.length).fill(true);
    	const writable_props = [];

    	Object_1$1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Schedule> was created with unknown prop '${key}'`);
    	});

    	const click_handler = i => $$invalidate(0, shows[i] = !shows[i], shows);

    	$$self.$capture_state = () => ({
    		scheddata,
    		sched_data_loaded,
    		Noschedule,
    		isToday,
    		toEnDate,
    		fade,
    		PairCount,
    		shows,
    		$scheddata,
    		$sched_data_loaded
    	});

    	$$self.$inject_state = $$props => {
    		if ("shows" in $$props) $$invalidate(0, shows = $$props.shows);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [shows, $scheddata, $sched_data_loaded, PairCount, click_handler];
    }

    class Schedule extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Schedule",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    var css_248z$5 = "";
    styleInject(css_248z$5);

    /* src/Comps/shahsched.svelte generated by Svelte v3.38.3 */

    const { Object: Object_1 } = globals;
    const file$9 = "src/Comps/shahsched.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	child_ctx[10] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i][0];
    	child_ctx[15] = list[i][1];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i][0];
    	child_ctx[15] = list[i][1];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    // (37:0) {#if Object.keys($scheddata).length}
    function create_if_block$3(ctx) {
    	let div;
    	let current;
    	let each_value = /*$scheddata*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "pair-wrapper svelte-1xddm7n");
    			add_location(div, file$9, 37, 4, 862);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scheddata, Object, timepairs, parseInt, PairItem, toEnDate, startCol, isToday, shows, PairCount*/ 63) {
    				each_value = /*$scheddata*/ ctx[1];
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
    						each_blocks[i].m(div, null);
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
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(37:0) {#if Object.keys($scheddata).length}",
    		ctx
    	});

    	return block;
    }

    // (51:12) {#if shows[m]}
    function create_if_block_1$1(ctx) {
    	let div;
    	let t0;
    	let t1;
    	let each1_anchor;
    	let current;
    	let each_value_3 = Object.entries(/*timepairs*/ ctx[2]);
    	validate_each_argument(each_value_3);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_1[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_1 = /*month*/ ctx[8].DateDay;
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each1_anchor = empty();
    			set_style(div, "grid-column", "1 / 2}");
    			attr_dev(div, "class", "timepairs svelte-1xddm7n");
    			add_location(div, file$9, 51, 16, 1324);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			insert_dev(target, t0, anchor);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(target, anchor);
    			}

    			insert_dev(target, t1, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*parseInt, Object, timepairs*/ 4) {
    				each_value_3 = Object.entries(/*timepairs*/ ctx[2]);
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(t1.parentNode, t1);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_3.length;
    			}

    			if (dirty & /*Object, timepairs, parseInt, $scheddata, PairItem, toEnDate, startCol, isToday*/ 54) {
    				each_value_1 = /*month*/ ctx[8].DateDay;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each1_anchor.parentNode, each1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value_1.length; i += 1) {
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
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t1);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(51:12) {#if shows[m]}",
    		ctx
    	});

    	return block;
    }

    // (54:16) {#each Object.entries(timepairs) as [n_pair, time], n}
    function create_each_block_3(ctx) {
    	let div;
    	let t_value = /*time*/ ctx[15] + "";
    	let t;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t = text(t_value);
    			set_style(div, "grid-column", parseInt(/*n_pair*/ ctx[14]) + 1 + " / " + (parseInt(/*n_pair*/ ctx[14]) + 2));
    			attr_dev(div, "class", "timepairs svelte-1xddm7n");
    			add_location(div, file$9, 54, 20, 1472);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(54:16) {#each Object.entries(timepairs) as [n_pair, time], n}",
    		ctx
    	});

    	return block;
    }

    // (77:24) {#if isToday(day.DatePair)}
    function create_if_block_3(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			div.textContent = "Сегодня";
    			attr_dev(div, "class", "today-lbl svelte-1xddm7n");
    			add_location(div, file$9, 77, 28, 2403);
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
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(77:24) {#if isToday(day.DatePair)}",
    		ctx
    	});

    	return block;
    }

    // (99:28) {:else}
    function create_else_block$1(ctx) {
    	let div5;
    	let div0;
    	let t0_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).SubjSN + "";
    	let t0;
    	let t1;
    	let div3;
    	let div1;
    	let t2_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).Aud + "";
    	let t2;
    	let t3;
    	let div2;
    	let t4_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).LoadKindSN + "";
    	let t4;
    	let t5;
    	let div4;
    	let t6_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).GSName + "";
    	let t6;
    	let div5_title_value;

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			div3 = element("div");
    			div1 = element("div");
    			t2 = text(t2_value);
    			t3 = space();
    			div2 = element("div");
    			t4 = text(t4_value);
    			t5 = space();
    			div4 = element("div");
    			t6 = text(t6_value);
    			attr_dev(div0, "class", "subj svelte-1xddm7n");
    			add_location(div0, file$9, 104, 36, 3555);
    			attr_dev(div1, "class", "aud svelte-1xddm7n");
    			add_location(div1, file$9, 109, 40, 3798);
    			attr_dev(div2, "class", "kind-load svelte-1xddm7n");
    			add_location(div2, file$9, 112, 40, 3982);
    			attr_dev(div3, "class", "aud-wrapper svelte-1xddm7n");
    			add_location(div3, file$9, 108, 36, 3732);
    			attr_dev(div4, "class", "groups svelte-1xddm7n");
    			add_location(div4, file$9, 118, 36, 4268);
    			attr_dev(div5, "title", div5_title_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).TimeStart);
    			attr_dev(div5, "class", "pair-detail svelte-1xddm7n");
    			add_location(div5, file$9, 99, 32, 3300);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div0);
    			append_dev(div0, t0);
    			append_dev(div5, t1);
    			append_dev(div5, div3);
    			append_dev(div3, div1);
    			append_dev(div1, t2);
    			append_dev(div3, t3);
    			append_dev(div3, div2);
    			append_dev(div2, t4);
    			append_dev(div5, t5);
    			append_dev(div5, div4);
    			append_dev(div4, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scheddata*/ 2 && t0_value !== (t0_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).SubjSN + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$scheddata*/ 2 && t2_value !== (t2_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).Aud + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$scheddata*/ 2 && t4_value !== (t4_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).LoadKindSN + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$scheddata*/ 2 && t6_value !== (t6_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).GSName + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*$scheddata*/ 2 && div5_title_value !== (div5_title_value = /*PairItem*/ ctx[5](/*day*/ ctx[11].Schedule, /*time*/ ctx[15]).TimeStart)) {
    				attr_dev(div5, "title", div5_title_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(99:28) {:else}",
    		ctx
    	});

    	return block;
    }

    // (97:28) {#if day.Schedule.findIndex((el) => el.TimeStart == time) == -1}
    function create_if_block_2$1(ctx) {
    	let t_value = "" + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(97:28) {#if day.Schedule.findIndex((el) => el.TimeStart == time) == -1}",
    		ctx
    	});

    	return block;
    }

    // (89:20) {#each Object.entries(timepairs) as [n_pair, time]}
    function create_each_block_2(ctx) {
    	let div;
    	let show_if;
    	let t;
    	let div_intro;
    	let div_outro;
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[6](/*time*/ ctx[15], ...args);
    	}

    	function select_block_type(ctx, dirty) {
    		if (show_if == null || dirty & /*$scheddata*/ 2) show_if = !!(/*day*/ ctx[11].Schedule.findIndex(func) == -1);
    		if (show_if) return create_if_block_2$1;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx, -1);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if_block.c();
    			t = space();
    			set_style(div, "grid-column", parseInt(/*n_pair*/ ctx[14]) + 1 + " / " + (parseInt(/*n_pair*/ ctx[14]) + 2));
    			attr_dev(div, "class", "pair-ceil svelte-1xddm7n");
    			add_location(div, file$9, 89, 24, 2802);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if_block.m(div, null);
    			append_dev(div, t);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (current_block_type === (current_block_type = select_block_type(ctx, dirty)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div, t);
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);
    				if (!div_intro) div_intro = create_in_transition(div, fade, { duration: 1000 });
    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, {});
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(89:20) {#each Object.entries(timepairs) as [n_pair, time]}",
    		ctx
    	});

    	return block;
    }

    // (65:16) {#each month.DateDay as day, d}
    function create_each_block_1(ctx) {
    	let div2;
    	let show_if = isToday(/*day*/ ctx[11].DatePair);
    	let t0;
    	let div0;
    	let t1_value = /*day*/ ctx[11].DatePair + "";
    	let t1;
    	let t2;
    	let div1;
    	let t3_value = /*day*/ ctx[11].DayWeek + "";
    	let t3;
    	let div2_id_value;
    	let div2_class_value;
    	let div2_intro;
    	let div2_outro;
    	let t4;
    	let each_1_anchor;
    	let current;
    	let if_block = show_if && create_if_block_3(ctx);
    	let each_value_2 = Object.entries(/*timepairs*/ ctx[2]);
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			if (if_block) if_block.c();
    			t0 = space();
    			div0 = element("div");
    			t1 = text(t1_value);
    			t2 = space();
    			div1 = element("div");
    			t3 = text(t3_value);
    			t4 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			add_location(div0, file$9, 80, 24, 2495);
    			add_location(div1, file$9, 83, 24, 2599);
    			attr_dev(div2, "id", div2_id_value = toEnDate(/*day*/ ctx[11].DatePair));
    			set_style(div2, "grid-column", /*startCol*/ ctx[4] + " / " + (/*startCol*/ ctx[4] + 1));

    			attr_dev(div2, "class", div2_class_value = "first-ceil " + (/*day*/ ctx[11].DayWeek == "Суббота"
    			? "sbt"
    			: "date-pair") + "   " + (isToday(/*day*/ ctx[11].DatePair) ? "today" : "") + " svelte-1xddm7n");

    			add_location(div2, file$9, 65, 20, 1840);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			if (if_block) if_block.m(div2, null);
    			append_dev(div2, t0);
    			append_dev(div2, div0);
    			append_dev(div0, t1);
    			append_dev(div2, t2);
    			append_dev(div2, div1);
    			append_dev(div1, t3);
    			insert_dev(target, t4, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scheddata*/ 2) show_if = isToday(/*day*/ ctx[11].DatePair);

    			if (show_if) {
    				if (if_block) ; else {
    					if_block = create_if_block_3(ctx);
    					if_block.c();
    					if_block.m(div2, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*$scheddata*/ 2) && t1_value !== (t1_value = /*day*/ ctx[11].DatePair + "")) set_data_dev(t1, t1_value);
    			if ((!current || dirty & /*$scheddata*/ 2) && t3_value !== (t3_value = /*day*/ ctx[11].DayWeek + "")) set_data_dev(t3, t3_value);

    			if (!current || dirty & /*$scheddata*/ 2 && div2_id_value !== (div2_id_value = toEnDate(/*day*/ ctx[11].DatePair))) {
    				attr_dev(div2, "id", div2_id_value);
    			}

    			if (!current || dirty & /*$scheddata*/ 2 && div2_class_value !== (div2_class_value = "first-ceil " + (/*day*/ ctx[11].DayWeek == "Суббота"
    			? "sbt"
    			: "date-pair") + "   " + (isToday(/*day*/ ctx[11].DatePair) ? "today" : "") + " svelte-1xddm7n")) {
    				attr_dev(div2, "class", div2_class_value);
    			}

    			if (dirty & /*parseInt, Object, timepairs, $scheddata, PairItem*/ 38) {
    				each_value_2 = Object.entries(/*timepairs*/ ctx[2]);
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div2_outro) div2_outro.end(1);
    				if (!div2_intro) div2_intro = create_in_transition(div2, fade, { duration: 500 });
    				div2_intro.start();
    			});

    			for (let i = 0; i < each_value_2.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			if (div2_intro) div2_intro.invalidate();
    			div2_outro = create_out_transition(div2, fade, {});
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			if (if_block) if_block.d();
    			if (detaching && div2_outro) div2_outro.end();
    			if (detaching) detach_dev(t4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(65:16) {#each month.DateDay as day, d}",
    		ctx
    	});

    	return block;
    }

    // (39:8) {#each $scheddata as month, m}
    function create_each_block(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*month*/ ctx[8].Month + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*PairCount*/ ctx[3](/*month*/ ctx[8].DateDay) + "";
    	let t2;
    	let t3;
    	let t4_value = /*month*/ ctx[8].DateDay.length + "";
    	let t4;
    	let t5;
    	let t6;
    	let if_block_anchor;
    	let current;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*m*/ ctx[10]);
    	}

    	let if_block = /*shows*/ ctx[0][/*m*/ ctx[10]] && create_if_block_1$1(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			t3 = text(" пар; ");
    			t4 = text(t4_value);
    			t5 = text(" дней");
    			t6 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span0, "class", "svelte-1xddm7n");
    			add_location(span0, file$9, 44, 16, 1106);
    			attr_dev(span1, "class", "svelte-1xddm7n");
    			add_location(span1, file$9, 45, 16, 1150);
    			set_style(div, "grid-column", "1 / 10");
    			attr_dev(div, "class", "month svelte-1xddm7n");
    			add_location(div, file$9, 39, 12, 940);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    			append_dev(span1, t3);
    			append_dev(span1, t4);
    			append_dev(span1, t5);
    			insert_dev(target, t6, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*$scheddata*/ 2) && t0_value !== (t0_value = /*month*/ ctx[8].Month + "")) set_data_dev(t0, t0_value);
    			if ((!current || dirty & /*$scheddata*/ 2) && t2_value !== (t2_value = /*PairCount*/ ctx[3](/*month*/ ctx[8].DateDay) + "")) set_data_dev(t2, t2_value);
    			if ((!current || dirty & /*$scheddata*/ 2) && t4_value !== (t4_value = /*month*/ ctx[8].DateDay.length + "")) set_data_dev(t4, t4_value);

    			if (/*shows*/ ctx[0][/*m*/ ctx[10]]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*shows*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block_1$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t6);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(39:8) {#each $scheddata as month, m}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let show_if = Object.keys(/*$scheddata*/ ctx[1]).length;
    	let if_block_anchor;
    	let current;
    	let if_block = show_if && create_if_block$3(ctx);

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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$scheddata*/ 2) show_if = Object.keys(/*$scheddata*/ ctx[1]).length;

    			if (show_if) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$scheddata*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    	let $scheddata;
    	validate_store(scheddata, "scheddata");
    	component_subscribe($$self, scheddata, $$value => $$invalidate(1, $scheddata = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Shahsched", slots, []);
    	let shows = Array($scheddata.length).fill(true);

    	let timepairs = {
    		1: "08:30",
    		2: "10:15",
    		3: "12:00",
    		4: "14:05",
    		5: "15:50",
    		6: "17:35",
    		7: "19:15",
    		8: "20:55"
    	};

    	const PairCount = daysArr => {
    		//считает кол-во пар в мес.
    		let pcount = 0;

    		daysArr.forEach(day => {
    			pcount += day["Schedule"].length;
    		});

    		return pcount;
    	};

    	let startCol = 1;

    	const PairItem = (sch, ptime) => {
    		return sch.find(e => e.TimeStart == ptime);
    	};

    	const writable_props = [];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Shahsched> was created with unknown prop '${key}'`);
    	});

    	const func = (time, el) => el.TimeStart == time;
    	const click_handler = m => $$invalidate(0, shows[m] = !shows[m], shows);

    	$$self.$capture_state = () => ({
    		scheddata,
    		sched_data_loaded,
    		fade,
    		isToday,
    		toEnDate,
    		shows,
    		timepairs,
    		PairCount,
    		startCol,
    		PairItem,
    		$scheddata
    	});

    	$$self.$inject_state = $$props => {
    		if ("shows" in $$props) $$invalidate(0, shows = $$props.shows);
    		if ("timepairs" in $$props) $$invalidate(2, timepairs = $$props.timepairs);
    		if ("startCol" in $$props) $$invalidate(4, startCol = $$props.startCol);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		shows,
    		$scheddata,
    		timepairs,
    		PairCount,
    		startCol,
    		PairItem,
    		func,
    		click_handler
    	];
    }

    class Shahsched extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Shahsched",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    var css_248z$4 = "";
    styleInject(css_248z$4);

    /* src/Comps/progbar.svelte generated by Svelte v3.38.3 */
    const file$8 = "src/Comps/progbar.svelte";

    // (8:0) {#if $load_sched_data}
    function create_if_block$2(ctx) {
    	let div;
    	let fa;
    	let current;

    	fa = new Fa({
    			props: {
    				icon: faSpinner,
    				size: "3x",
    				spin: true,
    				color: "blue"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(fa.$$.fragment);
    			attr_dev(div, "class", "progbar svelte-o2xa4k");
    			add_location(div, file$8, 8, 4, 242);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(fa, div, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(fa);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(8:0) {#if $load_sched_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$load_sched_data*/ ctx[0] && create_if_block$2(ctx);

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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$load_sched_data*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$load_sched_data*/ 1) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$2(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $load_sched_data;
    	validate_store(load_sched_data, "load_sched_data");
    	component_subscribe($$self, load_sched_data, $$value => $$invalidate(0, $load_sched_data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Progbar", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Progbar> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		load_sched_data,
    		fade,
    		Fa,
    		faSpinner,
    		$load_sched_data
    	});

    	return [$load_sched_data];
    }

    class Progbar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Progbar",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    var css_248z$3 = "";
    styleInject(css_248z$3);

    /* node_modules/svelte-drawer-component/src/Drawer.svelte generated by Svelte v3.38.3 */
    const file$7 = "node_modules/svelte-drawer-component/src/Drawer.svelte";

    function create_fragment$7(ctx) {
    	let aside;
    	let div0;
    	let t;
    	let div1;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	const default_slot_template = /*#slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			aside = element("aside");
    			div0 = element("div");
    			t = space();
    			div1 = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div0, "class", "overlay svelte-1c92i6o");
    			add_location(div0, file$7, 37, 4, 796);
    			attr_dev(div1, "class", div1_class_value = "panel " + /*placement*/ ctx[1] + " svelte-1c92i6o");
    			toggle_class(div1, "size", /*size*/ ctx[2]);
    			add_location(div1, file$7, 39, 4, 852);
    			attr_dev(aside, "class", "drawer svelte-1c92i6o");
    			attr_dev(aside, "style", /*style*/ ctx[3]);
    			toggle_class(aside, "open", /*open*/ ctx[0]);
    			add_location(aside, file$7, 35, 0, 749);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, aside, anchor);
    			append_dev(aside, div0);
    			append_dev(aside, t);
    			append_dev(aside, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*handleClickAway*/ ctx[4], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot) {
    				if (default_slot.p && (!current || dirty & /*$$scope*/ 64)) {
    					update_slot(default_slot, default_slot_template, ctx, /*$$scope*/ ctx[6], !current ? -1 : dirty, null, null);
    				}
    			}

    			if (!current || dirty & /*placement*/ 2 && div1_class_value !== (div1_class_value = "panel " + /*placement*/ ctx[1] + " svelte-1c92i6o")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			if (dirty & /*placement, size*/ 6) {
    				toggle_class(div1, "size", /*size*/ ctx[2]);
    			}

    			if (!current || dirty & /*style*/ 8) {
    				attr_dev(aside, "style", /*style*/ ctx[3]);
    			}

    			if (dirty & /*open*/ 1) {
    				toggle_class(aside, "open", /*open*/ ctx[0]);
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
    			if (detaching) detach_dev(aside);
    			if (default_slot) default_slot.d(detaching);
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
    	let style;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Drawer", slots, ['default']);
    	let { open = false } = $$props;
    	let { duration = 0.2 } = $$props;
    	let { placement = "left" } = $$props;
    	let { size = null } = $$props;
    	let mounted = false;
    	const dispatch = createEventDispatcher();

    	function scrollLock(open) {
    		if (mounted) {
    			const body = document.querySelector("body");
    			body.style.overflow = open ? "hidden" : "auto";
    		}
    	}

    	function handleClickAway() {
    		dispatch("clickAway");
    	}

    	onMount(() => {
    		mounted = true;
    		scrollLock(open);
    	});

    	const writable_props = ["open", "duration", "placement", "size"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Drawer> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("open" in $$props) $$invalidate(0, open = $$props.open);
    		if ("duration" in $$props) $$invalidate(5, duration = $$props.duration);
    		if ("placement" in $$props) $$invalidate(1, placement = $$props.placement);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		createEventDispatcher,
    		open,
    		duration,
    		placement,
    		size,
    		mounted,
    		dispatch,
    		scrollLock,
    		handleClickAway,
    		style
    	});

    	$$self.$inject_state = $$props => {
    		if ("open" in $$props) $$invalidate(0, open = $$props.open);
    		if ("duration" in $$props) $$invalidate(5, duration = $$props.duration);
    		if ("placement" in $$props) $$invalidate(1, placement = $$props.placement);
    		if ("size" in $$props) $$invalidate(2, size = $$props.size);
    		if ("mounted" in $$props) mounted = $$props.mounted;
    		if ("style" in $$props) $$invalidate(3, style = $$props.style);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*duration, size*/ 36) {
    			$$invalidate(3, style = `--duration: ${duration}s; --size: ${size};`);
    		}

    		if ($$self.$$.dirty & /*open*/ 1) {
    			scrollLock(open);
    		}
    	};

    	return [open, placement, size, style, handleClickAway, duration, $$scope, slots];
    }

    class Drawer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			open: 0,
    			duration: 5,
    			placement: 1,
    			size: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Drawer",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get open() {
    		throw new Error("<Drawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set open(value) {
    		throw new Error("<Drawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get duration() {
    		throw new Error("<Drawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set duration(value) {
    		throw new Error("<Drawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get placement() {
    		throw new Error("<Drawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set placement(value) {
    		throw new Error("<Drawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get size() {
    		throw new Error("<Drawer>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set size(value) {
    		throw new Error("<Drawer>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* node_modules/svelte-switch/src/components/CheckedIcon.svelte generated by Svelte v3.38.3 */

    const file$6 = "node_modules/svelte-switch/src/components/CheckedIcon.svelte";

    function create_fragment$6(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M11.264 0L5.26 6.004 2.103 2.847 0 4.95l5.26 5.26 8.108-8.107L11.264 0");
    			attr_dev(path, "fill", "#fff");
    			attr_dev(path, "fillrule", "evenodd");
    			add_location(path, file$6, 5, 2, 105);
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "viewBox", "-2 -5 17 21");
    			set_style(svg, "position", "absolute");
    			set_style(svg, "top", "0");
    			add_location(svg, file$6, 0, 0, 0);
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
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("CheckedIcon", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<CheckedIcon> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class CheckedIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "CheckedIcon",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* node_modules/svelte-switch/src/components/UncheckedIcon.svelte generated by Svelte v3.38.3 */

    const file$5 = "node_modules/svelte-switch/src/components/UncheckedIcon.svelte";

    function create_fragment$5(ctx) {
    	let svg;
    	let path;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "d", "M9.9 2.12L7.78 0 4.95 2.828 2.12 0 0 2.12l2.83 2.83L0 7.776 2.123 9.9\r\n    4.95 7.07 7.78 9.9 9.9 7.776 7.072 4.95 9.9 2.12");
    			attr_dev(path, "fill", "#fff");
    			attr_dev(path, "fillrule", "evenodd");
    			add_location(path, file$5, 5, 2, 106);
    			attr_dev(svg, "viewBox", "-2 -5 14 20");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "width", "100%");
    			set_style(svg, "position", "absolute");
    			set_style(svg, "top", "0");
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
    	validate_slots("UncheckedIcon", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<UncheckedIcon> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class UncheckedIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "UncheckedIcon",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    function createBackgroundColor(
      pos,
      checkedPos,
      uncheckedPos,
      offColor,
      onColor
    ) {
      const relativePos = (pos - uncheckedPos) / (checkedPos - uncheckedPos);
      if (relativePos === 0) {
        return offColor;
      }
      if (relativePos === 1) {
        return onColor;
      }

      let newColor = "#";
      for (let i = 1; i < 6; i += 2) {
        const offComponent = parseInt(offColor.substr(i, 2), 16);
        const onComponent = parseInt(onColor.substr(i, 2), 16);
        const weightedValue = Math.round(
          (1 - relativePos) * offComponent + relativePos * onComponent
        );
        let newComponent = weightedValue.toString(16);
        if (newComponent.length === 1) {
          newComponent = `0${newComponent}`;
        }
        newColor += newComponent;
      }
      return newColor;
    }

    function convertShorthandColor(color) {
      if (color.length === 7) {
        return color;
      }
      let sixDigitColor = "#";
      for (let i = 1; i < 4; i += 1) {
        sixDigitColor += color[i] + color[i];
      }
      return sixDigitColor;
    }

    function getBackgroundColor(
      pos,
      checkedPos,
      uncheckedPos,
      offColor,
      onColor
    ) {
      const sixDigitOffColor = convertShorthandColor(offColor);
      const sixDigitOnColor = convertShorthandColor(onColor);
      return createBackgroundColor(
        pos,
        checkedPos,
        uncheckedPos,
        sixDigitOffColor,
        sixDigitOnColor
      );
    }

    /* node_modules/svelte-switch/src/components/Switch.svelte generated by Svelte v3.38.3 */
    const file$4 = "node_modules/svelte-switch/src/components/Switch.svelte";
    const get_unCheckedIcon_slot_changes = dirty => ({});
    const get_unCheckedIcon_slot_context = ctx => ({});
    const get_checkedIcon_slot_changes = dirty => ({});
    const get_checkedIcon_slot_context = ctx => ({});

    // (313:31)           
    function fallback_block_1(ctx) {
    	let cicon;
    	let current;
    	cicon = new /*CIcon*/ ctx[18]({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(cicon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(cicon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(cicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(cicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(cicon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block_1.name,
    		type: "fallback",
    		source: "(313:31)           ",
    		ctx
    	});

    	return block;
    }

    // (318:33)           
    function fallback_block(ctx) {
    	let uicon;
    	let current;
    	uicon = new /*UIcon*/ ctx[19]({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(uicon.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(uicon, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(uicon.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(uicon.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(uicon, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: fallback_block.name,
    		type: "fallback",
    		source: "(318:33)           ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div4;
    	let div2;
    	let div0;
    	let t0;
    	let div1;
    	let t1;
    	let div3;
    	let t2;
    	let input;
    	let current;
    	let mounted;
    	let dispose;
    	const checkedIcon_slot_template = /*#slots*/ ctx[35].checkedIcon;
    	const checkedIcon_slot = create_slot(checkedIcon_slot_template, ctx, /*$$scope*/ ctx[34], get_checkedIcon_slot_context);
    	const checkedIcon_slot_or_fallback = checkedIcon_slot || fallback_block_1(ctx);
    	const unCheckedIcon_slot_template = /*#slots*/ ctx[35].unCheckedIcon;
    	const unCheckedIcon_slot = create_slot(unCheckedIcon_slot_template, ctx, /*$$scope*/ ctx[34], get_unCheckedIcon_slot_context);
    	const unCheckedIcon_slot_or_fallback = unCheckedIcon_slot || fallback_block(ctx);

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div0 = element("div");
    			if (checkedIcon_slot_or_fallback) checkedIcon_slot_or_fallback.c();
    			t0 = space();
    			div1 = element("div");
    			if (unCheckedIcon_slot_or_fallback) unCheckedIcon_slot_or_fallback.c();
    			t1 = space();
    			div3 = element("div");
    			t2 = space();
    			input = element("input");
    			attr_dev(div0, "style", /*checkedIconStyle*/ ctx[5]);
    			add_location(div0, file$4, 311, 4, 8377);
    			attr_dev(div1, "style", /*uncheckedIconStyle*/ ctx[6]);
    			add_location(div1, file$4, 316, 4, 8492);
    			attr_dev(div2, "class", "react-switch-bg");
    			attr_dev(div2, "style", /*backgroundStyle*/ ctx[4]);
    			attr_dev(div2, "onmousedown", func);
    			add_location(div2, file$4, 306, 2, 8223);
    			attr_dev(div3, "class", "react-switch-handle");
    			attr_dev(div3, "style", /*handleStyle*/ ctx[7]);
    			add_location(div3, file$4, 322, 2, 8619);
    			attr_dev(input, "type", "checkbox");
    			attr_dev(input, "role", "switch");
    			input.disabled = /*disabled*/ ctx[0];
    			attr_dev(input, "style", /*inputStyle*/ ctx[8]);
    			add_location(input, file$4, 331, 2, 8984);
    			attr_dev(div4, "class", /*containerClass*/ ctx[1]);
    			attr_dev(div4, "style", /*rootStyle*/ ctx[3]);
    			add_location(div4, file$4, 305, 0, 8173);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div2);
    			append_dev(div2, div0);

    			if (checkedIcon_slot_or_fallback) {
    				checkedIcon_slot_or_fallback.m(div0, null);
    			}

    			append_dev(div2, t0);
    			append_dev(div2, div1);

    			if (unCheckedIcon_slot_or_fallback) {
    				unCheckedIcon_slot_or_fallback.m(div1, null);
    			}

    			append_dev(div4, t1);
    			append_dev(div4, div3);
    			append_dev(div4, t2);
    			append_dev(div4, input);
    			/*input_binding*/ ctx[36](input);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						div2,
    						"click",
    						function () {
    							if (is_function(/*disabled*/ ctx[0] ? null : /*onClick*/ ctx[17])) (/*disabled*/ ctx[0] ? null : /*onClick*/ ctx[17]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(div3, "click", click_handler, false, false, false),
    					listen_dev(
    						div3,
    						"mousedown",
    						function () {
    							if (is_function(/*disabled*/ ctx[0] ? null : /*onMouseDown*/ ctx[9])) (/*disabled*/ ctx[0] ? null : /*onMouseDown*/ ctx[9]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div3,
    						"touchstart",
    						function () {
    							if (is_function(/*disabled*/ ctx[0] ? null : /*onTouchStart*/ ctx[10])) (/*disabled*/ ctx[0] ? null : /*onTouchStart*/ ctx[10]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div3,
    						"touchmove",
    						function () {
    							if (is_function(/*disabled*/ ctx[0] ? null : /*onTouchMove*/ ctx[11])) (/*disabled*/ ctx[0] ? null : /*onTouchMove*/ ctx[11]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div3,
    						"touchend",
    						function () {
    							if (is_function(/*disabled*/ ctx[0] ? null : /*onTouchEnd*/ ctx[12])) (/*disabled*/ ctx[0] ? null : /*onTouchEnd*/ ctx[12]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						div3,
    						"touchcancel",
    						function () {
    							if (is_function(/*disabled*/ ctx[0] ? null : /*unsetHasOutline*/ ctx[16])) (/*disabled*/ ctx[0] ? null : /*unsetHasOutline*/ ctx[16]).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(input, "focus", /*setHasOutline*/ ctx[15], false, false, false),
    					listen_dev(input, "blur", /*unsetHasOutline*/ ctx[16], false, false, false),
    					listen_dev(input, "keyup", /*onKeyUp*/ ctx[14], false, false, false),
    					listen_dev(input, "change", /*onInputChange*/ ctx[13], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (checkedIcon_slot) {
    				if (checkedIcon_slot.p && (!current || dirty[1] & /*$$scope*/ 8)) {
    					update_slot(checkedIcon_slot, checkedIcon_slot_template, ctx, /*$$scope*/ ctx[34], !current ? [-1, -1] : dirty, get_checkedIcon_slot_changes, get_checkedIcon_slot_context);
    				}
    			}

    			if (!current || dirty[0] & /*checkedIconStyle*/ 32) {
    				attr_dev(div0, "style", /*checkedIconStyle*/ ctx[5]);
    			}

    			if (unCheckedIcon_slot) {
    				if (unCheckedIcon_slot.p && (!current || dirty[1] & /*$$scope*/ 8)) {
    					update_slot(unCheckedIcon_slot, unCheckedIcon_slot_template, ctx, /*$$scope*/ ctx[34], !current ? [-1, -1] : dirty, get_unCheckedIcon_slot_changes, get_unCheckedIcon_slot_context);
    				}
    			}

    			if (!current || dirty[0] & /*uncheckedIconStyle*/ 64) {
    				attr_dev(div1, "style", /*uncheckedIconStyle*/ ctx[6]);
    			}

    			if (!current || dirty[0] & /*backgroundStyle*/ 16) {
    				attr_dev(div2, "style", /*backgroundStyle*/ ctx[4]);
    			}

    			if (!current || dirty[0] & /*handleStyle*/ 128) {
    				attr_dev(div3, "style", /*handleStyle*/ ctx[7]);
    			}

    			if (!current || dirty[0] & /*disabled*/ 1) {
    				prop_dev(input, "disabled", /*disabled*/ ctx[0]);
    			}

    			if (!current || dirty[0] & /*inputStyle*/ 256) {
    				attr_dev(input, "style", /*inputStyle*/ ctx[8]);
    			}

    			if (!current || dirty[0] & /*containerClass*/ 2) {
    				attr_dev(div4, "class", /*containerClass*/ ctx[1]);
    			}

    			if (!current || dirty[0] & /*rootStyle*/ 8) {
    				attr_dev(div4, "style", /*rootStyle*/ ctx[3]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(checkedIcon_slot_or_fallback, local);
    			transition_in(unCheckedIcon_slot_or_fallback, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(checkedIcon_slot_or_fallback, local);
    			transition_out(unCheckedIcon_slot_or_fallback, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			if (checkedIcon_slot_or_fallback) checkedIcon_slot_or_fallback.d(detaching);
    			if (unCheckedIcon_slot_or_fallback) unCheckedIcon_slot_or_fallback.d(detaching);
    			/*input_binding*/ ctx[36](null);
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

    const func = e => e.preventDefault();
    const click_handler = e => e.preventDefault();

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Switch", slots, ['checkedIcon','unCheckedIcon']);
    	let { checked } = $$props;
    	let { disabled = false } = $$props;
    	let { offColor = "#888" } = $$props;
    	let { onColor = "#080" } = $$props;
    	let { offHandleColor = "#fff" } = $$props;
    	let { onHandleColor = "#fff" } = $$props;
    	let { handleDiameter } = $$props;
    	let { unCheckedIcon = UncheckedIcon } = $$props;
    	let { checkedIcon = CheckedIcon } = $$props;
    	let { boxShadow = null } = $$props;
    	let { activeBoxShadow = "0 0 2px 3px #3bf" } = $$props;
    	let { height = 28 } = $$props;
    	let { width = 56 } = $$props;
    	let { id = "" } = $$props;
    	let { containerClass = "" } = $$props;
    	const dispatch = createEventDispatcher();

    	//state
    	let state = {
    		handleDiameter: 0,
    		checkedPos: 0,
    		uncheckedPos: 0,
    		pos: 0,
    		lastDragAt: 0,
    		lastKeyUpAt: 0,
    		startX: null,
    		hasOutline: null,
    		dragStartingTime: null,
    		checkedStateFromDragging: false
    	};

    	let inputRef = null;
    	state.handleDiameter = handleDiameter || height - 2;
    	state.checkedPos = Math.max(width - height, width - (height + state.handleDiameter) / 2);
    	state.uncheckedPos = Math.max(0, (height - state.handleDiameter) / 2);
    	state.pos = checked ? state.checkedPos : state.uncheckedPos;
    	state.lastDragAt = 0;
    	state.lastKeyUpAt = 0;

    	//event handlers
    	function onDragStart(clientX) {
    		inputRef && inputRef.focus && inputRef.focus();
    		$$invalidate(33, state.startX = clientX, state);
    		$$invalidate(33, state.hasOutline = true, state);
    		$$invalidate(33, state.dragStartingTime = Date.now(), state);
    	}

    	function onDrag(clientX) {
    		let { startX, isDragging, pos } = state;
    		const startPos = checked ? state.checkedPos : state.uncheckedPos;
    		const mousePos = startPos + clientX - startX;

    		// We need this check to fix a windows glitch where onDrag is triggered onMouseDown in some cases
    		if (!isDragging && clientX !== startX) {
    			$$invalidate(33, state.isDragging = true, state);
    		}

    		const newPos = Math.min(state.checkedPos, Math.max(state.uncheckedPos, mousePos));

    		// Prevent unnecessary rerenders
    		if (newPos !== pos) {
    			$$invalidate(33, state.pos = newPos, state);
    		}
    	}

    	function onDragStop(event) {
    		let { pos, isDragging, dragStartingTime } = state;
    		const halfwayCheckpoint = (state.checkedPos + state.uncheckedPos) / 2;

    		// Simulate clicking the handle
    		const timeSinceStart = Date.now() - dragStartingTime;

    		if (!isDragging || timeSinceStart < 250) {
    			onChangeTrigger(event);
    		} else if (checked) {
    			if (pos > halfwayCheckpoint) {
    				$$invalidate(33, state.pos = state.checkedPos, state); // Handle dragging from checked position
    			} else {
    				onChangeTrigger(event);
    			}
    		} else if (pos < halfwayCheckpoint) {
    			$$invalidate(33, state.pos = state.uncheckedPos, state); // Handle dragging from unchecked position
    		} else {
    			onChangeTrigger(event);
    		}

    		$$invalidate(33, state.isDragging = false, state);
    		$$invalidate(33, state.hasOutline = false, state);
    		$$invalidate(33, state.lastDragAt = Date.now(), state);
    	}

    	function onMouseDown(event) {
    		event.preventDefault();

    		// Ignore right click and scroll
    		if (typeof event.button === "number" && event.button !== 0) {
    			return;
    		}

    		onDragStart(event.clientX);
    		window.addEventListener("mousemove", onMouseMove);
    		window.addEventListener("mouseup", onMouseUp);
    	}

    	function onMouseMove(event) {
    		event.preventDefault();
    		onDrag(event.clientX);
    	}

    	function onMouseUp(event) {
    		onDragStop(event);
    		window.removeEventListener("mousemove", onMouseMove);
    		window.removeEventListener("mouseup", onMouseUp);
    	}

    	function onTouchStart(event) {
    		$$invalidate(33, state.checkedStateFromDragging = null, state);
    		onDragStart(event.touches[0].clientX);
    	}

    	function onTouchMove(event) {
    		onDrag(event.touches[0].clientX);
    	}

    	function onTouchEnd(event) {
    		event.preventDefault();
    		onDragStop(event);
    	}

    	function onInputChange(event) {
    		// This condition is unfortunately needed in some browsers where the input's change event might get triggered
    		// right after the dragstop event is triggered (occurs when dropping over a label element)
    		if (Date.now() - state.lastDragAt > 50) {
    			onChangeTrigger(event);

    			// Prevent clicking label, but not key activation from setting outline to true - yes, this is absurd
    			if (Date.now() - state.lastKeyUpAt > 50) {
    				$$invalidate(33, state.hasOutline = false, state);
    			}
    		}
    	}

    	function onKeyUp() {
    		$$invalidate(33, state.lastKeyUpAt = Date.now(), state);
    	}

    	function setHasOutline() {
    		$$invalidate(33, state.hasOutline = true, state);
    	}

    	function unsetHasOutline() {
    		$$invalidate(33, state.hasOutline = false, state);
    	}

    	function onClick(event) {
    		event.preventDefault();
    		inputRef.focus();
    		onChangeTrigger(event);
    		$$invalidate(33, state.hasOutline = false, state);
    	}

    	function onChangeTrigger(event) {
    		$$invalidate(20, checked = !checked);
    		dispatch("change", { checked, event, id });
    	}

    	//Hack since components should always to starting with Capital letter and props are camelCasing
    	let CIcon = checkedIcon;

    	let UIcon = unCheckedIcon;

    	//styles
    	let rootStyle = "";

    	let backgroundStyle = "";
    	let checkedIconStyle = "";
    	let uncheckedIconStyle = "";
    	let handleStyle = "";
    	let inputStyle = "";

    	const writable_props = [
    		"checked",
    		"disabled",
    		"offColor",
    		"onColor",
    		"offHandleColor",
    		"onHandleColor",
    		"handleDiameter",
    		"unCheckedIcon",
    		"checkedIcon",
    		"boxShadow",
    		"activeBoxShadow",
    		"height",
    		"width",
    		"id",
    		"containerClass"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Switch> was created with unknown prop '${key}'`);
    	});

    	function input_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			inputRef = $$value;
    			$$invalidate(2, inputRef);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("checked" in $$props) $$invalidate(20, checked = $$props.checked);
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("offColor" in $$props) $$invalidate(21, offColor = $$props.offColor);
    		if ("onColor" in $$props) $$invalidate(22, onColor = $$props.onColor);
    		if ("offHandleColor" in $$props) $$invalidate(23, offHandleColor = $$props.offHandleColor);
    		if ("onHandleColor" in $$props) $$invalidate(24, onHandleColor = $$props.onHandleColor);
    		if ("handleDiameter" in $$props) $$invalidate(25, handleDiameter = $$props.handleDiameter);
    		if ("unCheckedIcon" in $$props) $$invalidate(26, unCheckedIcon = $$props.unCheckedIcon);
    		if ("checkedIcon" in $$props) $$invalidate(27, checkedIcon = $$props.checkedIcon);
    		if ("boxShadow" in $$props) $$invalidate(28, boxShadow = $$props.boxShadow);
    		if ("activeBoxShadow" in $$props) $$invalidate(29, activeBoxShadow = $$props.activeBoxShadow);
    		if ("height" in $$props) $$invalidate(30, height = $$props.height);
    		if ("width" in $$props) $$invalidate(31, width = $$props.width);
    		if ("id" in $$props) $$invalidate(32, id = $$props.id);
    		if ("containerClass" in $$props) $$invalidate(1, containerClass = $$props.containerClass);
    		if ("$$scope" in $$props) $$invalidate(34, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		createEventDispatcher,
    		defaultCheckedIcon: CheckedIcon,
    		defaultUncheckedIcon: UncheckedIcon,
    		getBackgroundColor,
    		checked,
    		disabled,
    		offColor,
    		onColor,
    		offHandleColor,
    		onHandleColor,
    		handleDiameter,
    		unCheckedIcon,
    		checkedIcon,
    		boxShadow,
    		activeBoxShadow,
    		height,
    		width,
    		id,
    		containerClass,
    		dispatch,
    		state,
    		inputRef,
    		onDragStart,
    		onDrag,
    		onDragStop,
    		onMouseDown,
    		onMouseMove,
    		onMouseUp,
    		onTouchStart,
    		onTouchMove,
    		onTouchEnd,
    		onInputChange,
    		onKeyUp,
    		setHasOutline,
    		unsetHasOutline,
    		onClick,
    		onChangeTrigger,
    		CIcon,
    		UIcon,
    		rootStyle,
    		backgroundStyle,
    		checkedIconStyle,
    		uncheckedIconStyle,
    		handleStyle,
    		inputStyle
    	});

    	$$self.$inject_state = $$props => {
    		if ("checked" in $$props) $$invalidate(20, checked = $$props.checked);
    		if ("disabled" in $$props) $$invalidate(0, disabled = $$props.disabled);
    		if ("offColor" in $$props) $$invalidate(21, offColor = $$props.offColor);
    		if ("onColor" in $$props) $$invalidate(22, onColor = $$props.onColor);
    		if ("offHandleColor" in $$props) $$invalidate(23, offHandleColor = $$props.offHandleColor);
    		if ("onHandleColor" in $$props) $$invalidate(24, onHandleColor = $$props.onHandleColor);
    		if ("handleDiameter" in $$props) $$invalidate(25, handleDiameter = $$props.handleDiameter);
    		if ("unCheckedIcon" in $$props) $$invalidate(26, unCheckedIcon = $$props.unCheckedIcon);
    		if ("checkedIcon" in $$props) $$invalidate(27, checkedIcon = $$props.checkedIcon);
    		if ("boxShadow" in $$props) $$invalidate(28, boxShadow = $$props.boxShadow);
    		if ("activeBoxShadow" in $$props) $$invalidate(29, activeBoxShadow = $$props.activeBoxShadow);
    		if ("height" in $$props) $$invalidate(30, height = $$props.height);
    		if ("width" in $$props) $$invalidate(31, width = $$props.width);
    		if ("id" in $$props) $$invalidate(32, id = $$props.id);
    		if ("containerClass" in $$props) $$invalidate(1, containerClass = $$props.containerClass);
    		if ("state" in $$props) $$invalidate(33, state = $$props.state);
    		if ("inputRef" in $$props) $$invalidate(2, inputRef = $$props.inputRef);
    		if ("CIcon" in $$props) $$invalidate(18, CIcon = $$props.CIcon);
    		if ("UIcon" in $$props) $$invalidate(19, UIcon = $$props.UIcon);
    		if ("rootStyle" in $$props) $$invalidate(3, rootStyle = $$props.rootStyle);
    		if ("backgroundStyle" in $$props) $$invalidate(4, backgroundStyle = $$props.backgroundStyle);
    		if ("checkedIconStyle" in $$props) $$invalidate(5, checkedIconStyle = $$props.checkedIconStyle);
    		if ("uncheckedIconStyle" in $$props) $$invalidate(6, uncheckedIconStyle = $$props.uncheckedIconStyle);
    		if ("handleStyle" in $$props) $$invalidate(7, handleStyle = $$props.handleStyle);
    		if ("inputStyle" in $$props) $$invalidate(8, inputStyle = $$props.inputStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty[0] & /*checked*/ 1048576 | $$self.$$.dirty[1] & /*state*/ 4) {
    			if (!state.isDragging) {
    				$$invalidate(33, state.pos = checked ? state.checkedPos : state.uncheckedPos, state);
    			}
    		}

    		if ($$self.$$.dirty[0] & /*disabled, height*/ 1073741825) {
    			$$invalidate(3, rootStyle = `
    position: relative;
    display: inline-block;
    text-align: left;
    opacity: ${disabled ? 0.5 : 1};
    direction: ltr;
    border-radius: ${height / 2}px;
    transition: opacity 0.25s;
    touch-action: none;
    webkit-tap-highlight-color: rgba(0, 0, 0, 0);
    user-select: none;
  `);
    		}

    		if ($$self.$$.dirty[0] & /*height, offColor, onColor, disabled*/ 1080033281 | $$self.$$.dirty[1] & /*width, state*/ 5) {
    			$$invalidate(4, backgroundStyle = `
    height: ${height}px;
    width: ${width}px;
    margin: ${Math.max(0, (state.handleDiameter - height) / 2)}px;
    position: relative;
    background: ${getBackgroundColor(state.pos, state.checkedPos, state.uncheckedPos, offColor, onColor)};
    border-radius: ${height / 2}px;
    cursor: ${disabled ? "default" : "pointer"};
    transition: ${state.isDragging ? null : "background 0.25s"};
  `);
    		}

    		if ($$self.$$.dirty[0] & /*height*/ 1073741824 | $$self.$$.dirty[1] & /*width, state*/ 5) {
    			$$invalidate(5, checkedIconStyle = `
    height: ${height}px;
    width: ${Math.min(height * 1.5, width - (state.handleDiameter + height) / 2 + 1)}px;
    position: relative;
    opacity:
      ${(state.pos - state.uncheckedPos) / (state.checkedPos - state.uncheckedPos)};
    pointer-events: none;
    transition: ${state.isDragging ? null : "opacity 0.25s"};
  `);
    		}

    		if ($$self.$$.dirty[0] & /*height*/ 1073741824 | $$self.$$.dirty[1] & /*width, state*/ 5) {
    			$$invalidate(6, uncheckedIconStyle = `
    height: ${height}px;
    width: ${Math.min(height * 1.5, width - (state.handleDiameter + height) / 2 + 1)}px;
    position: absolute;
    opacity:
      ${1 - (state.pos - state.uncheckedPos) / (state.checkedPos - state.uncheckedPos)};
    right: 0px;
    top: 0px;
    pointer-events: none;
    transition: ${state.isDragging ? null : "opacity 0.25s"};
  `);
    		}

    		if ($$self.$$.dirty[0] & /*offHandleColor, onHandleColor, disabled, height, activeBoxShadow, boxShadow*/ 1904214017 | $$self.$$.dirty[1] & /*state*/ 4) {
    			$$invalidate(7, handleStyle = `
    height: ${state.handleDiameter}px;
    width: ${state.handleDiameter}px;
    background: ${getBackgroundColor(state.pos, state.checkedPos, state.uncheckedPos, offHandleColor, onHandleColor)};
    display: inline-block;
    cursor: ${disabled ? "default" : "pointer"};
    border-radius: 50%;
    position: absolute;
    transform: translateX(${state.pos}px);
    top: ${Math.max(0, (height - state.handleDiameter) / 2)}px;
    outline: 0;
    box-shadow: ${state.hasOutline ? activeBoxShadow : boxShadow};
    border: 0;
    transition: ${state.isDragging
			? null
			: "background-color 0.25s, transform 0.25s, box-shadow 0.15s"};
  `);
    		}
    	};

    	$$invalidate(8, inputStyle = `
    border: 0px;
    clip: rect(0 0 0 0);
    height: 1px;
    margin: -1px;
    overflow: hidden;
    padding: 0px;
    position: absolute;
    width: 1px;
  `);

    	return [
    		disabled,
    		containerClass,
    		inputRef,
    		rootStyle,
    		backgroundStyle,
    		checkedIconStyle,
    		uncheckedIconStyle,
    		handleStyle,
    		inputStyle,
    		onMouseDown,
    		onTouchStart,
    		onTouchMove,
    		onTouchEnd,
    		onInputChange,
    		onKeyUp,
    		setHasOutline,
    		unsetHasOutline,
    		onClick,
    		CIcon,
    		UIcon,
    		checked,
    		offColor,
    		onColor,
    		offHandleColor,
    		onHandleColor,
    		handleDiameter,
    		unCheckedIcon,
    		checkedIcon,
    		boxShadow,
    		activeBoxShadow,
    		height,
    		width,
    		id,
    		state,
    		$$scope,
    		slots,
    		input_binding
    	];
    }

    class Switch extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$4,
    			create_fragment$4,
    			safe_not_equal,
    			{
    				checked: 20,
    				disabled: 0,
    				offColor: 21,
    				onColor: 22,
    				offHandleColor: 23,
    				onHandleColor: 24,
    				handleDiameter: 25,
    				unCheckedIcon: 26,
    				checkedIcon: 27,
    				boxShadow: 28,
    				activeBoxShadow: 29,
    				height: 30,
    				width: 31,
    				id: 32,
    				containerClass: 1
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Switch",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*checked*/ ctx[20] === undefined && !("checked" in props)) {
    			console.warn("<Switch> was created without expected prop 'checked'");
    		}

    		if (/*handleDiameter*/ ctx[25] === undefined && !("handleDiameter" in props)) {
    			console.warn("<Switch> was created without expected prop 'handleDiameter'");
    		}
    	}

    	get checked() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checked(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get disabled() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set disabled(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offColor() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offColor(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onColor() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onColor(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get offHandleColor() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set offHandleColor(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get onHandleColor() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set onHandleColor(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleDiameter() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleDiameter(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get unCheckedIcon() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set unCheckedIcon(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checkedIcon() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checkedIcon(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get boxShadow() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set boxShadow(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeBoxShadow() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeBoxShadow(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get width() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set width(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get id() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set id(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get containerClass() {
    		throw new Error("<Switch>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set containerClass(value) {
    		throw new Error("<Switch>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var css_248z$2 = "";
    styleInject(css_248z$2);

    /* src/Comps/viewformat.svelte generated by Svelte v3.38.3 */
    const file$3 = "src/Comps/viewformat.svelte";

    // (36:0) {#if $client_width > 500}
    function create_if_block$1(ctx) {
    	let div0;
    	let t1;
    	let div4;
    	let div1;
    	let t2;
    	let div1_class_value;
    	let t3;
    	let div2;
    	let switch_1;
    	let t4;
    	let div3;
    	let t5;
    	let div3_class_value;
    	let t6;
    	let br;
    	let current;
    	let mounted;
    	let dispose;

    	switch_1 = new Switch({
    			props: {
    				checked: /*checkedValue*/ ctx[0],
    				width: "80",
    				$$slots: {
    					unCheckedIcon: [create_unCheckedIcon_slot],
    					checkedIcon: [create_checkedIcon_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	switch_1.$on("change", /*handleChange*/ ctx[2]);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div0.textContent = "Формат:";
    			t1 = space();
    			div4 = element("div");
    			div1 = element("div");
    			t2 = text("Таблица");
    			t3 = space();
    			div2 = element("div");
    			create_component(switch_1.$$.fragment);
    			t4 = space();
    			div3 = element("div");
    			t5 = text("Шахматка");
    			t6 = space();
    			br = element("br");
    			attr_dev(div0, "class", "switch-caption svelte-pt90rz");
    			add_location(div0, file$3, 36, 4, 847);
    			attr_dev(div1, "class", div1_class_value = "format-caption " + (/*checkedValue*/ ctx[0] ? "format-active" : "") + " svelte-pt90rz");
    			add_location(div1, file$3, 38, 8, 930);
    			add_location(div2, file$3, 44, 8, 1111);
    			attr_dev(div3, "class", div3_class_value = "format-caption  " + (!/*checkedValue*/ ctx[0] ? "format-active" : "") + " svelte-pt90rz");
    			add_location(div3, file$3, 67, 8, 1866);
    			attr_dev(div4, "class", "switch-wrapper svelte-pt90rz");
    			add_location(div4, file$3, 37, 4, 893);
    			add_location(br, file$3, 74, 4, 2057);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div1);
    			append_dev(div1, t2);
    			append_dev(div4, t3);
    			append_dev(div4, div2);
    			mount_component(switch_1, div2, null);
    			append_dev(div4, t4);
    			append_dev(div4, div3);
    			append_dev(div3, t5);
    			insert_dev(target, t6, anchor);
    			insert_dev(target, br, anchor);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(div1, "click", /*click_handler*/ ctx[5], false, false, false),
    					listen_dev(div3, "click", /*click_handler_1*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (!current || dirty & /*checkedValue*/ 1 && div1_class_value !== (div1_class_value = "format-caption " + (/*checkedValue*/ ctx[0] ? "format-active" : "") + " svelte-pt90rz")) {
    				attr_dev(div1, "class", div1_class_value);
    			}

    			const switch_1_changes = {};
    			if (dirty & /*checkedValue*/ 1) switch_1_changes.checked = /*checkedValue*/ ctx[0];

    			if (dirty & /*$$scope*/ 128) {
    				switch_1_changes.$$scope = { dirty, ctx };
    			}

    			switch_1.$set(switch_1_changes);

    			if (!current || dirty & /*checkedValue*/ 1 && div3_class_value !== (div3_class_value = "format-caption  " + (!/*checkedValue*/ ctx[0] ? "format-active" : "") + " svelte-pt90rz")) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(switch_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(switch_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div4);
    			destroy_component(switch_1);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(br);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(36:0) {#if $client_width > 500}",
    		ctx
    	});

    	return block;
    }

    // (47:16) 
    function create_checkedIcon_slot(ctx) {
    	let svg;
    	let fa;
    	let current;

    	fa = new Fa({
    			props: {
    				icon: faTableList,
    				color: "wheat",
    				size: "1x"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			create_component(fa.$$.fragment);
    			attr_dev(svg, "viewBox", "0 0 10 10");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "fill", "aqua");
    			attr_dev(svg, "slot", "checkedIcon");
    			add_location(svg, file$3, 46, 16, 1213);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			mount_component(fa, svg, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_component(fa);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_checkedIcon_slot.name,
    		type: "slot",
    		source: "(47:16) ",
    		ctx
    	});

    	return block;
    }

    // (57:16) 
    function create_unCheckedIcon_slot(ctx) {
    	let svg;
    	let fa;
    	let current;

    	fa = new Fa({
    			props: {
    				icon: faTableCells,
    				color: "wheat",
    				size: "1x"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			create_component(fa.$$.fragment);
    			attr_dev(svg, "viewBox", "0 0 10 10");
    			attr_dev(svg, "height", "100%");
    			attr_dev(svg, "width", "100%");
    			attr_dev(svg, "fill", "blue");
    			attr_dev(svg, "slot", "unCheckedIcon");
    			add_location(svg, file$3, 56, 16, 1524);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			mount_component(fa, svg, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			destroy_component(fa);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_unCheckedIcon_slot.name,
    		type: "slot",
    		source: "(57:16) ",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$client_width*/ ctx[1] > 500 && create_if_block$1(ctx);

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
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$client_width*/ ctx[1] > 500) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$client_width*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
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
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
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
    	let $client_width;
    	validate_store(client_width, "client_width");
    	component_subscribe($$self, client_width, $$value => $$invalidate(1, $client_width = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Viewformat", slots, []);
    	let { changeformat } = $$props;
    	let checkedValue = true;

    	function handleChange(e) {
    		const { checked } = e.detail;
    		$$invalidate(0, checkedValue = checked);
    		changeformat(checkedValue);
    	}

    	const toggleFormat = frm => {
    		if (frm == "tabl") $$invalidate(0, checkedValue = true); else $$invalidate(0, checkedValue = false);
    		changeformat(checkedValue);
    	};

    	//автом-ки ставим таблицу при малой ширине
    	client_width.subscribe(width => {
    		if (width < 500) {
    			$$invalidate(0, checkedValue = true);
    			changeformat(checkedValue);
    		}
    	});

    	const writable_props = ["changeformat"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Viewformat> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => toggleFormat("tabl");
    	const click_handler_1 = () => toggleFormat("shah");

    	$$self.$$set = $$props => {
    		if ("changeformat" in $$props) $$invalidate(4, changeformat = $$props.changeformat);
    	};

    	$$self.$capture_state = () => ({
    		Switch,
    		Fa,
    		client_width,
    		faTableCells,
    		faTableList,
    		changeformat,
    		checkedValue,
    		handleChange,
    		toggleFormat,
    		$client_width
    	});

    	$$self.$inject_state = $$props => {
    		if ("changeformat" in $$props) $$invalidate(4, changeformat = $$props.changeformat);
    		if ("checkedValue" in $$props) $$invalidate(0, checkedValue = $$props.checkedValue);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		checkedValue,
    		$client_width,
    		handleChange,
    		toggleFormat,
    		changeformat,
    		click_handler,
    		click_handler_1
    	];
    }

    class Viewformat extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { changeformat: 4 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Viewformat",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*changeformat*/ ctx[4] === undefined && !("changeformat" in props)) {
    			console.warn("<Viewformat> was created without expected prop 'changeformat'");
    		}
    	}

    	get changeformat() {
    		throw new Error("<Viewformat>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set changeformat(value) {
    		throw new Error("<Viewformat>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /**
     * A collection of shims that provide minimal functionality of the ES6 collections.
     *
     * These implementations are not meant to be used outside of the ResizeObserver
     * modules as they cover only a limited range of use cases.
     */
    /* eslint-disable require-jsdoc, valid-jsdoc */
    var MapShim = (function () {
        if (typeof Map !== 'undefined') {
            return Map;
        }
        /**
         * Returns index in provided array that matches the specified key.
         *
         * @param {Array<Array>} arr
         * @param {*} key
         * @returns {number}
         */
        function getIndex(arr, key) {
            var result = -1;
            arr.some(function (entry, index) {
                if (entry[0] === key) {
                    result = index;
                    return true;
                }
                return false;
            });
            return result;
        }
        return /** @class */ (function () {
            function class_1() {
                this.__entries__ = [];
            }
            Object.defineProperty(class_1.prototype, "size", {
                /**
                 * @returns {boolean}
                 */
                get: function () {
                    return this.__entries__.length;
                },
                enumerable: true,
                configurable: true
            });
            /**
             * @param {*} key
             * @returns {*}
             */
            class_1.prototype.get = function (key) {
                var index = getIndex(this.__entries__, key);
                var entry = this.__entries__[index];
                return entry && entry[1];
            };
            /**
             * @param {*} key
             * @param {*} value
             * @returns {void}
             */
            class_1.prototype.set = function (key, value) {
                var index = getIndex(this.__entries__, key);
                if (~index) {
                    this.__entries__[index][1] = value;
                }
                else {
                    this.__entries__.push([key, value]);
                }
            };
            /**
             * @param {*} key
             * @returns {void}
             */
            class_1.prototype.delete = function (key) {
                var entries = this.__entries__;
                var index = getIndex(entries, key);
                if (~index) {
                    entries.splice(index, 1);
                }
            };
            /**
             * @param {*} key
             * @returns {void}
             */
            class_1.prototype.has = function (key) {
                return !!~getIndex(this.__entries__, key);
            };
            /**
             * @returns {void}
             */
            class_1.prototype.clear = function () {
                this.__entries__.splice(0);
            };
            /**
             * @param {Function} callback
             * @param {*} [ctx=null]
             * @returns {void}
             */
            class_1.prototype.forEach = function (callback, ctx) {
                if (ctx === void 0) { ctx = null; }
                for (var _i = 0, _a = this.__entries__; _i < _a.length; _i++) {
                    var entry = _a[_i];
                    callback.call(ctx, entry[1], entry[0]);
                }
            };
            return class_1;
        }());
    })();

    /**
     * Detects whether window and document objects are available in current environment.
     */
    var isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined' && window.document === document;

    // Returns global object of a current environment.
    var global$1 = (function () {
        if (typeof global !== 'undefined' && global.Math === Math) {
            return global;
        }
        if (typeof self !== 'undefined' && self.Math === Math) {
            return self;
        }
        if (typeof window !== 'undefined' && window.Math === Math) {
            return window;
        }
        // eslint-disable-next-line no-new-func
        return Function('return this')();
    })();

    /**
     * A shim for the requestAnimationFrame which falls back to the setTimeout if
     * first one is not supported.
     *
     * @returns {number} Requests' identifier.
     */
    var requestAnimationFrame$1 = (function () {
        if (typeof requestAnimationFrame === 'function') {
            // It's required to use a bounded function because IE sometimes throws
            // an "Invalid calling object" error if rAF is invoked without the global
            // object on the left hand side.
            return requestAnimationFrame.bind(global$1);
        }
        return function (callback) { return setTimeout(function () { return callback(Date.now()); }, 1000 / 60); };
    })();

    // Defines minimum timeout before adding a trailing call.
    var trailingTimeout = 2;
    /**
     * Creates a wrapper function which ensures that provided callback will be
     * invoked only once during the specified delay period.
     *
     * @param {Function} callback - Function to be invoked after the delay period.
     * @param {number} delay - Delay after which to invoke callback.
     * @returns {Function}
     */
    function throttle (callback, delay) {
        var leadingCall = false, trailingCall = false, lastCallTime = 0;
        /**
         * Invokes the original callback function and schedules new invocation if
         * the "proxy" was called during current request.
         *
         * @returns {void}
         */
        function resolvePending() {
            if (leadingCall) {
                leadingCall = false;
                callback();
            }
            if (trailingCall) {
                proxy();
            }
        }
        /**
         * Callback invoked after the specified delay. It will further postpone
         * invocation of the original function delegating it to the
         * requestAnimationFrame.
         *
         * @returns {void}
         */
        function timeoutCallback() {
            requestAnimationFrame$1(resolvePending);
        }
        /**
         * Schedules invocation of the original function.
         *
         * @returns {void}
         */
        function proxy() {
            var timeStamp = Date.now();
            if (leadingCall) {
                // Reject immediately following calls.
                if (timeStamp - lastCallTime < trailingTimeout) {
                    return;
                }
                // Schedule new call to be in invoked when the pending one is resolved.
                // This is important for "transitions" which never actually start
                // immediately so there is a chance that we might miss one if change
                // happens amids the pending invocation.
                trailingCall = true;
            }
            else {
                leadingCall = true;
                trailingCall = false;
                setTimeout(timeoutCallback, delay);
            }
            lastCallTime = timeStamp;
        }
        return proxy;
    }

    // Minimum delay before invoking the update of observers.
    var REFRESH_DELAY = 20;
    // A list of substrings of CSS properties used to find transition events that
    // might affect dimensions of observed elements.
    var transitionKeys = ['top', 'right', 'bottom', 'left', 'width', 'height', 'size', 'weight'];
    // Check if MutationObserver is available.
    var mutationObserverSupported = typeof MutationObserver !== 'undefined';
    /**
     * Singleton controller class which handles updates of ResizeObserver instances.
     */
    var ResizeObserverController = /** @class */ (function () {
        /**
         * Creates a new instance of ResizeObserverController.
         *
         * @private
         */
        function ResizeObserverController() {
            /**
             * Indicates whether DOM listeners have been added.
             *
             * @private {boolean}
             */
            this.connected_ = false;
            /**
             * Tells that controller has subscribed for Mutation Events.
             *
             * @private {boolean}
             */
            this.mutationEventsAdded_ = false;
            /**
             * Keeps reference to the instance of MutationObserver.
             *
             * @private {MutationObserver}
             */
            this.mutationsObserver_ = null;
            /**
             * A list of connected observers.
             *
             * @private {Array<ResizeObserverSPI>}
             */
            this.observers_ = [];
            this.onTransitionEnd_ = this.onTransitionEnd_.bind(this);
            this.refresh = throttle(this.refresh.bind(this), REFRESH_DELAY);
        }
        /**
         * Adds observer to observers list.
         *
         * @param {ResizeObserverSPI} observer - Observer to be added.
         * @returns {void}
         */
        ResizeObserverController.prototype.addObserver = function (observer) {
            if (!~this.observers_.indexOf(observer)) {
                this.observers_.push(observer);
            }
            // Add listeners if they haven't been added yet.
            if (!this.connected_) {
                this.connect_();
            }
        };
        /**
         * Removes observer from observers list.
         *
         * @param {ResizeObserverSPI} observer - Observer to be removed.
         * @returns {void}
         */
        ResizeObserverController.prototype.removeObserver = function (observer) {
            var observers = this.observers_;
            var index = observers.indexOf(observer);
            // Remove observer if it's present in registry.
            if (~index) {
                observers.splice(index, 1);
            }
            // Remove listeners if controller has no connected observers.
            if (!observers.length && this.connected_) {
                this.disconnect_();
            }
        };
        /**
         * Invokes the update of observers. It will continue running updates insofar
         * it detects changes.
         *
         * @returns {void}
         */
        ResizeObserverController.prototype.refresh = function () {
            var changesDetected = this.updateObservers_();
            // Continue running updates if changes have been detected as there might
            // be future ones caused by CSS transitions.
            if (changesDetected) {
                this.refresh();
            }
        };
        /**
         * Updates every observer from observers list and notifies them of queued
         * entries.
         *
         * @private
         * @returns {boolean} Returns "true" if any observer has detected changes in
         *      dimensions of it's elements.
         */
        ResizeObserverController.prototype.updateObservers_ = function () {
            // Collect observers that have active observations.
            var activeObservers = this.observers_.filter(function (observer) {
                return observer.gatherActive(), observer.hasActive();
            });
            // Deliver notifications in a separate cycle in order to avoid any
            // collisions between observers, e.g. when multiple instances of
            // ResizeObserver are tracking the same element and the callback of one
            // of them changes content dimensions of the observed target. Sometimes
            // this may result in notifications being blocked for the rest of observers.
            activeObservers.forEach(function (observer) { return observer.broadcastActive(); });
            return activeObservers.length > 0;
        };
        /**
         * Initializes DOM listeners.
         *
         * @private
         * @returns {void}
         */
        ResizeObserverController.prototype.connect_ = function () {
            // Do nothing if running in a non-browser environment or if listeners
            // have been already added.
            if (!isBrowser || this.connected_) {
                return;
            }
            // Subscription to the "Transitionend" event is used as a workaround for
            // delayed transitions. This way it's possible to capture at least the
            // final state of an element.
            document.addEventListener('transitionend', this.onTransitionEnd_);
            window.addEventListener('resize', this.refresh);
            if (mutationObserverSupported) {
                this.mutationsObserver_ = new MutationObserver(this.refresh);
                this.mutationsObserver_.observe(document, {
                    attributes: true,
                    childList: true,
                    characterData: true,
                    subtree: true
                });
            }
            else {
                document.addEventListener('DOMSubtreeModified', this.refresh);
                this.mutationEventsAdded_ = true;
            }
            this.connected_ = true;
        };
        /**
         * Removes DOM listeners.
         *
         * @private
         * @returns {void}
         */
        ResizeObserverController.prototype.disconnect_ = function () {
            // Do nothing if running in a non-browser environment or if listeners
            // have been already removed.
            if (!isBrowser || !this.connected_) {
                return;
            }
            document.removeEventListener('transitionend', this.onTransitionEnd_);
            window.removeEventListener('resize', this.refresh);
            if (this.mutationsObserver_) {
                this.mutationsObserver_.disconnect();
            }
            if (this.mutationEventsAdded_) {
                document.removeEventListener('DOMSubtreeModified', this.refresh);
            }
            this.mutationsObserver_ = null;
            this.mutationEventsAdded_ = false;
            this.connected_ = false;
        };
        /**
         * "Transitionend" event handler.
         *
         * @private
         * @param {TransitionEvent} event
         * @returns {void}
         */
        ResizeObserverController.prototype.onTransitionEnd_ = function (_a) {
            var _b = _a.propertyName, propertyName = _b === void 0 ? '' : _b;
            // Detect whether transition may affect dimensions of an element.
            var isReflowProperty = transitionKeys.some(function (key) {
                return !!~propertyName.indexOf(key);
            });
            if (isReflowProperty) {
                this.refresh();
            }
        };
        /**
         * Returns instance of the ResizeObserverController.
         *
         * @returns {ResizeObserverController}
         */
        ResizeObserverController.getInstance = function () {
            if (!this.instance_) {
                this.instance_ = new ResizeObserverController();
            }
            return this.instance_;
        };
        /**
         * Holds reference to the controller's instance.
         *
         * @private {ResizeObserverController}
         */
        ResizeObserverController.instance_ = null;
        return ResizeObserverController;
    }());

    /**
     * Defines non-writable/enumerable properties of the provided target object.
     *
     * @param {Object} target - Object for which to define properties.
     * @param {Object} props - Properties to be defined.
     * @returns {Object} Target object.
     */
    var defineConfigurable = (function (target, props) {
        for (var _i = 0, _a = Object.keys(props); _i < _a.length; _i++) {
            var key = _a[_i];
            Object.defineProperty(target, key, {
                value: props[key],
                enumerable: false,
                writable: false,
                configurable: true
            });
        }
        return target;
    });

    /**
     * Returns the global object associated with provided element.
     *
     * @param {Object} target
     * @returns {Object}
     */
    var getWindowOf = (function (target) {
        // Assume that the element is an instance of Node, which means that it
        // has the "ownerDocument" property from which we can retrieve a
        // corresponding global object.
        var ownerGlobal = target && target.ownerDocument && target.ownerDocument.defaultView;
        // Return the local global object if it's not possible extract one from
        // provided element.
        return ownerGlobal || global$1;
    });

    // Placeholder of an empty content rectangle.
    var emptyRect = createRectInit(0, 0, 0, 0);
    /**
     * Converts provided string to a number.
     *
     * @param {number|string} value
     * @returns {number}
     */
    function toFloat(value) {
        return parseFloat(value) || 0;
    }
    /**
     * Extracts borders size from provided styles.
     *
     * @param {CSSStyleDeclaration} styles
     * @param {...string} positions - Borders positions (top, right, ...)
     * @returns {number}
     */
    function getBordersSize(styles) {
        var positions = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            positions[_i - 1] = arguments[_i];
        }
        return positions.reduce(function (size, position) {
            var value = styles['border-' + position + '-width'];
            return size + toFloat(value);
        }, 0);
    }
    /**
     * Extracts paddings sizes from provided styles.
     *
     * @param {CSSStyleDeclaration} styles
     * @returns {Object} Paddings box.
     */
    function getPaddings(styles) {
        var positions = ['top', 'right', 'bottom', 'left'];
        var paddings = {};
        for (var _i = 0, positions_1 = positions; _i < positions_1.length; _i++) {
            var position = positions_1[_i];
            var value = styles['padding-' + position];
            paddings[position] = toFloat(value);
        }
        return paddings;
    }
    /**
     * Calculates content rectangle of provided SVG element.
     *
     * @param {SVGGraphicsElement} target - Element content rectangle of which needs
     *      to be calculated.
     * @returns {DOMRectInit}
     */
    function getSVGContentRect(target) {
        var bbox = target.getBBox();
        return createRectInit(0, 0, bbox.width, bbox.height);
    }
    /**
     * Calculates content rectangle of provided HTMLElement.
     *
     * @param {HTMLElement} target - Element for which to calculate the content rectangle.
     * @returns {DOMRectInit}
     */
    function getHTMLElementContentRect(target) {
        // Client width & height properties can't be
        // used exclusively as they provide rounded values.
        var clientWidth = target.clientWidth, clientHeight = target.clientHeight;
        // By this condition we can catch all non-replaced inline, hidden and
        // detached elements. Though elements with width & height properties less
        // than 0.5 will be discarded as well.
        //
        // Without it we would need to implement separate methods for each of
        // those cases and it's not possible to perform a precise and performance
        // effective test for hidden elements. E.g. even jQuery's ':visible' filter
        // gives wrong results for elements with width & height less than 0.5.
        if (!clientWidth && !clientHeight) {
            return emptyRect;
        }
        var styles = getWindowOf(target).getComputedStyle(target);
        var paddings = getPaddings(styles);
        var horizPad = paddings.left + paddings.right;
        var vertPad = paddings.top + paddings.bottom;
        // Computed styles of width & height are being used because they are the
        // only dimensions available to JS that contain non-rounded values. It could
        // be possible to utilize the getBoundingClientRect if only it's data wasn't
        // affected by CSS transformations let alone paddings, borders and scroll bars.
        var width = toFloat(styles.width), height = toFloat(styles.height);
        // Width & height include paddings and borders when the 'border-box' box
        // model is applied (except for IE).
        if (styles.boxSizing === 'border-box') {
            // Following conditions are required to handle Internet Explorer which
            // doesn't include paddings and borders to computed CSS dimensions.
            //
            // We can say that if CSS dimensions + paddings are equal to the "client"
            // properties then it's either IE, and thus we don't need to subtract
            // anything, or an element merely doesn't have paddings/borders styles.
            if (Math.round(width + horizPad) !== clientWidth) {
                width -= getBordersSize(styles, 'left', 'right') + horizPad;
            }
            if (Math.round(height + vertPad) !== clientHeight) {
                height -= getBordersSize(styles, 'top', 'bottom') + vertPad;
            }
        }
        // Following steps can't be applied to the document's root element as its
        // client[Width/Height] properties represent viewport area of the window.
        // Besides, it's as well not necessary as the <html> itself neither has
        // rendered scroll bars nor it can be clipped.
        if (!isDocumentElement(target)) {
            // In some browsers (only in Firefox, actually) CSS width & height
            // include scroll bars size which can be removed at this step as scroll
            // bars are the only difference between rounded dimensions + paddings
            // and "client" properties, though that is not always true in Chrome.
            var vertScrollbar = Math.round(width + horizPad) - clientWidth;
            var horizScrollbar = Math.round(height + vertPad) - clientHeight;
            // Chrome has a rather weird rounding of "client" properties.
            // E.g. for an element with content width of 314.2px it sometimes gives
            // the client width of 315px and for the width of 314.7px it may give
            // 314px. And it doesn't happen all the time. So just ignore this delta
            // as a non-relevant.
            if (Math.abs(vertScrollbar) !== 1) {
                width -= vertScrollbar;
            }
            if (Math.abs(horizScrollbar) !== 1) {
                height -= horizScrollbar;
            }
        }
        return createRectInit(paddings.left, paddings.top, width, height);
    }
    /**
     * Checks whether provided element is an instance of the SVGGraphicsElement.
     *
     * @param {Element} target - Element to be checked.
     * @returns {boolean}
     */
    var isSVGGraphicsElement = (function () {
        // Some browsers, namely IE and Edge, don't have the SVGGraphicsElement
        // interface.
        if (typeof SVGGraphicsElement !== 'undefined') {
            return function (target) { return target instanceof getWindowOf(target).SVGGraphicsElement; };
        }
        // If it's so, then check that element is at least an instance of the
        // SVGElement and that it has the "getBBox" method.
        // eslint-disable-next-line no-extra-parens
        return function (target) { return (target instanceof getWindowOf(target).SVGElement &&
            typeof target.getBBox === 'function'); };
    })();
    /**
     * Checks whether provided element is a document element (<html>).
     *
     * @param {Element} target - Element to be checked.
     * @returns {boolean}
     */
    function isDocumentElement(target) {
        return target === getWindowOf(target).document.documentElement;
    }
    /**
     * Calculates an appropriate content rectangle for provided html or svg element.
     *
     * @param {Element} target - Element content rectangle of which needs to be calculated.
     * @returns {DOMRectInit}
     */
    function getContentRect(target) {
        if (!isBrowser) {
            return emptyRect;
        }
        if (isSVGGraphicsElement(target)) {
            return getSVGContentRect(target);
        }
        return getHTMLElementContentRect(target);
    }
    /**
     * Creates rectangle with an interface of the DOMRectReadOnly.
     * Spec: https://drafts.fxtf.org/geometry/#domrectreadonly
     *
     * @param {DOMRectInit} rectInit - Object with rectangle's x/y coordinates and dimensions.
     * @returns {DOMRectReadOnly}
     */
    function createReadOnlyRect(_a) {
        var x = _a.x, y = _a.y, width = _a.width, height = _a.height;
        // If DOMRectReadOnly is available use it as a prototype for the rectangle.
        var Constr = typeof DOMRectReadOnly !== 'undefined' ? DOMRectReadOnly : Object;
        var rect = Object.create(Constr.prototype);
        // Rectangle's properties are not writable and non-enumerable.
        defineConfigurable(rect, {
            x: x, y: y, width: width, height: height,
            top: y,
            right: x + width,
            bottom: height + y,
            left: x
        });
        return rect;
    }
    /**
     * Creates DOMRectInit object based on the provided dimensions and the x/y coordinates.
     * Spec: https://drafts.fxtf.org/geometry/#dictdef-domrectinit
     *
     * @param {number} x - X coordinate.
     * @param {number} y - Y coordinate.
     * @param {number} width - Rectangle's width.
     * @param {number} height - Rectangle's height.
     * @returns {DOMRectInit}
     */
    function createRectInit(x, y, width, height) {
        return { x: x, y: y, width: width, height: height };
    }

    /**
     * Class that is responsible for computations of the content rectangle of
     * provided DOM element and for keeping track of it's changes.
     */
    var ResizeObservation = /** @class */ (function () {
        /**
         * Creates an instance of ResizeObservation.
         *
         * @param {Element} target - Element to be observed.
         */
        function ResizeObservation(target) {
            /**
             * Broadcasted width of content rectangle.
             *
             * @type {number}
             */
            this.broadcastWidth = 0;
            /**
             * Broadcasted height of content rectangle.
             *
             * @type {number}
             */
            this.broadcastHeight = 0;
            /**
             * Reference to the last observed content rectangle.
             *
             * @private {DOMRectInit}
             */
            this.contentRect_ = createRectInit(0, 0, 0, 0);
            this.target = target;
        }
        /**
         * Updates content rectangle and tells whether it's width or height properties
         * have changed since the last broadcast.
         *
         * @returns {boolean}
         */
        ResizeObservation.prototype.isActive = function () {
            var rect = getContentRect(this.target);
            this.contentRect_ = rect;
            return (rect.width !== this.broadcastWidth ||
                rect.height !== this.broadcastHeight);
        };
        /**
         * Updates 'broadcastWidth' and 'broadcastHeight' properties with a data
         * from the corresponding properties of the last observed content rectangle.
         *
         * @returns {DOMRectInit} Last observed content rectangle.
         */
        ResizeObservation.prototype.broadcastRect = function () {
            var rect = this.contentRect_;
            this.broadcastWidth = rect.width;
            this.broadcastHeight = rect.height;
            return rect;
        };
        return ResizeObservation;
    }());

    var ResizeObserverEntry = /** @class */ (function () {
        /**
         * Creates an instance of ResizeObserverEntry.
         *
         * @param {Element} target - Element that is being observed.
         * @param {DOMRectInit} rectInit - Data of the element's content rectangle.
         */
        function ResizeObserverEntry(target, rectInit) {
            var contentRect = createReadOnlyRect(rectInit);
            // According to the specification following properties are not writable
            // and are also not enumerable in the native implementation.
            //
            // Property accessors are not being used as they'd require to define a
            // private WeakMap storage which may cause memory leaks in browsers that
            // don't support this type of collections.
            defineConfigurable(this, { target: target, contentRect: contentRect });
        }
        return ResizeObserverEntry;
    }());

    var ResizeObserverSPI = /** @class */ (function () {
        /**
         * Creates a new instance of ResizeObserver.
         *
         * @param {ResizeObserverCallback} callback - Callback function that is invoked
         *      when one of the observed elements changes it's content dimensions.
         * @param {ResizeObserverController} controller - Controller instance which
         *      is responsible for the updates of observer.
         * @param {ResizeObserver} callbackCtx - Reference to the public
         *      ResizeObserver instance which will be passed to callback function.
         */
        function ResizeObserverSPI(callback, controller, callbackCtx) {
            /**
             * Collection of resize observations that have detected changes in dimensions
             * of elements.
             *
             * @private {Array<ResizeObservation>}
             */
            this.activeObservations_ = [];
            /**
             * Registry of the ResizeObservation instances.
             *
             * @private {Map<Element, ResizeObservation>}
             */
            this.observations_ = new MapShim();
            if (typeof callback !== 'function') {
                throw new TypeError('The callback provided as parameter 1 is not a function.');
            }
            this.callback_ = callback;
            this.controller_ = controller;
            this.callbackCtx_ = callbackCtx;
        }
        /**
         * Starts observing provided element.
         *
         * @param {Element} target - Element to be observed.
         * @returns {void}
         */
        ResizeObserverSPI.prototype.observe = function (target) {
            if (!arguments.length) {
                throw new TypeError('1 argument required, but only 0 present.');
            }
            // Do nothing if current environment doesn't have the Element interface.
            if (typeof Element === 'undefined' || !(Element instanceof Object)) {
                return;
            }
            if (!(target instanceof getWindowOf(target).Element)) {
                throw new TypeError('parameter 1 is not of type "Element".');
            }
            var observations = this.observations_;
            // Do nothing if element is already being observed.
            if (observations.has(target)) {
                return;
            }
            observations.set(target, new ResizeObservation(target));
            this.controller_.addObserver(this);
            // Force the update of observations.
            this.controller_.refresh();
        };
        /**
         * Stops observing provided element.
         *
         * @param {Element} target - Element to stop observing.
         * @returns {void}
         */
        ResizeObserverSPI.prototype.unobserve = function (target) {
            if (!arguments.length) {
                throw new TypeError('1 argument required, but only 0 present.');
            }
            // Do nothing if current environment doesn't have the Element interface.
            if (typeof Element === 'undefined' || !(Element instanceof Object)) {
                return;
            }
            if (!(target instanceof getWindowOf(target).Element)) {
                throw new TypeError('parameter 1 is not of type "Element".');
            }
            var observations = this.observations_;
            // Do nothing if element is not being observed.
            if (!observations.has(target)) {
                return;
            }
            observations.delete(target);
            if (!observations.size) {
                this.controller_.removeObserver(this);
            }
        };
        /**
         * Stops observing all elements.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.disconnect = function () {
            this.clearActive();
            this.observations_.clear();
            this.controller_.removeObserver(this);
        };
        /**
         * Collects observation instances the associated element of which has changed
         * it's content rectangle.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.gatherActive = function () {
            var _this = this;
            this.clearActive();
            this.observations_.forEach(function (observation) {
                if (observation.isActive()) {
                    _this.activeObservations_.push(observation);
                }
            });
        };
        /**
         * Invokes initial callback function with a list of ResizeObserverEntry
         * instances collected from active resize observations.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.broadcastActive = function () {
            // Do nothing if observer doesn't have active observations.
            if (!this.hasActive()) {
                return;
            }
            var ctx = this.callbackCtx_;
            // Create ResizeObserverEntry instance for every active observation.
            var entries = this.activeObservations_.map(function (observation) {
                return new ResizeObserverEntry(observation.target, observation.broadcastRect());
            });
            this.callback_.call(ctx, entries, ctx);
            this.clearActive();
        };
        /**
         * Clears the collection of active observations.
         *
         * @returns {void}
         */
        ResizeObserverSPI.prototype.clearActive = function () {
            this.activeObservations_.splice(0);
        };
        /**
         * Tells whether observer has active observations.
         *
         * @returns {boolean}
         */
        ResizeObserverSPI.prototype.hasActive = function () {
            return this.activeObservations_.length > 0;
        };
        return ResizeObserverSPI;
    }());

    // Registry of internal observers. If WeakMap is not available use current shim
    // for the Map collection as it has all required methods and because WeakMap
    // can't be fully polyfilled anyway.
    var observers = typeof WeakMap !== 'undefined' ? new WeakMap() : new MapShim();
    /**
     * ResizeObserver API. Encapsulates the ResizeObserver SPI implementation
     * exposing only those methods and properties that are defined in the spec.
     */
    var ResizeObserver = /** @class */ (function () {
        /**
         * Creates a new instance of ResizeObserver.
         *
         * @param {ResizeObserverCallback} callback - Callback that is invoked when
         *      dimensions of the observed elements change.
         */
        function ResizeObserver(callback) {
            if (!(this instanceof ResizeObserver)) {
                throw new TypeError('Cannot call a class as a function.');
            }
            if (!arguments.length) {
                throw new TypeError('1 argument required, but only 0 present.');
            }
            var controller = ResizeObserverController.getInstance();
            var observer = new ResizeObserverSPI(callback, controller, this);
            observers.set(this, observer);
        }
        return ResizeObserver;
    }());
    // Expose public methods of ResizeObserver.
    [
        'observe',
        'unobserve',
        'disconnect'
    ].forEach(function (method) {
        ResizeObserver.prototype[method] = function () {
            var _a;
            return (_a = observers.get(this))[method].apply(_a, arguments);
        };
    });

    var index = (function () {
        // Export existing implementation if available.
        if (typeof global$1.ResizeObserver !== 'undefined') {
            return global$1.ResizeObserver;
        }
        return ResizeObserver;
    })();

    /* node_modules/svelte-resize-observer/dist/ResizeObserver.svelte generated by Svelte v3.38.3 */
    const file$2 = "node_modules/svelte-resize-observer/dist/ResizeObserver.svelte";

    function create_fragment$2(ctx) {
    	let div;

    	const block = {
    		c: function create() {
    			div = element("div");
    			set_style(div, "width", "0px");
    			add_location(div, file$2, 23, 0, 554);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			/*div_binding*/ ctx[3](div);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			/*div_binding*/ ctx[3](null);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ResizeObserver", slots, []);
    	let { elementResize = undefined } = $$props;
    	const dispatch = createEventDispatcher();
    	let component;
    	let RO;

    	onMount(() => {
    		$$invalidate(2, RO = new index(e => {
    				dispatch("resize", e[0].target);
    			}));
    	});

    	onDestroy(() => {
    		RO.disconnect();
    	});

    	const writable_props = ["elementResize"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ResizeObserver> was created with unknown prop '${key}'`);
    	});

    	function div_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			component = $$value;
    			$$invalidate(0, component);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("elementResize" in $$props) $$invalidate(1, elementResize = $$props.elementResize);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		onDestroy,
    		createEventDispatcher,
    		ResizeObserver: index,
    		elementResize,
    		dispatch,
    		component,
    		RO
    	});

    	$$self.$inject_state = $$props => {
    		if ("elementResize" in $$props) $$invalidate(1, elementResize = $$props.elementResize);
    		if ("component" in $$props) $$invalidate(0, component = $$props.component);
    		if ("RO" in $$props) $$invalidate(2, RO = $$props.RO);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*component, elementResize, RO*/ 7) {
    			{
    				if (component || elementResize) {
    					const element = elementResize ? elementResize : component.parentNode;
    					RO.observe(element);
    				}
    			}
    		}
    	};

    	return [component, elementResize, RO, div_binding];
    }

    class ResizeObserver_1 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { elementResize: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ResizeObserver_1",
    			options,
    			id: create_fragment$2.name
    		});
    	}

    	get elementResize() {
    		throw new Error("<ResizeObserver>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set elementResize(value) {
    		throw new Error("<ResizeObserver>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var css_248z$1 = "";
    styleInject(css_248z$1);

    /* src/Comps/errschedule.svelte generated by Svelte v3.38.3 */

    const file$1 = "src/Comps/errschedule.svelte";

    function create_fragment$1(ctx) {
    	let div2;
    	let div1;
    	let div0;
    	let t;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");
    			t = text(/*errmessage*/ ctx[0]);
    			attr_dev(div0, "class", "content");
    			add_location(div0, file$1, 6, 8, 113);
    			attr_dev(div1, "class", "card-content");
    			add_location(div1, file$1, 5, 4, 78);
    			attr_dev(div2, "class", "card err-box svelte-hex1se");
    			add_location(div2, file$1, 4, 0, 47);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*errmessage*/ 1) set_data_dev(t, /*errmessage*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
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
    	validate_slots("Errschedule", slots, []);
    	let { errmessage } = $$props;
    	const writable_props = ["errmessage"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Errschedule> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("errmessage" in $$props) $$invalidate(0, errmessage = $$props.errmessage);
    	};

    	$$self.$capture_state = () => ({ errmessage });

    	$$self.$inject_state = $$props => {
    		if ("errmessage" in $$props) $$invalidate(0, errmessage = $$props.errmessage);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [errmessage];
    }

    class Errschedule extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { errmessage: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Errschedule",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*errmessage*/ ctx[0] === undefined && !("errmessage" in props)) {
    			console.warn("<Errschedule> was created without expected prop 'errmessage'");
    		}
    	}

    	get errmessage() {
    		throw new Error("<Errschedule>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set errmessage(value) {
    		throw new Error("<Errschedule>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    var css_248z = "";
    styleInject(css_248z);

    /* src/App.svelte generated by Svelte v3.38.3 */

    const { document: document_1 } = globals;
    const file = "src/App.svelte";

    // (68:1) {#if scrolly > 100}
    function create_if_block_2(ctx) {
    	let div;
    	let fa;
    	let div_transition;
    	let current;
    	let mounted;
    	let dispose;

    	fa = new Fa({
    			props: {
    				icon: faArrowCircleUp,
    				color: "deepskyblue",
    				size: "2.5x"
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(fa.$$.fragment);
    			attr_dev(div, "class", "totop-box svelte-1e6r1wb");
    			add_location(div, file, 68, 2, 1536);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(fa, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*scrollToTop*/ ctx[5], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(fa.$$.fragment, local);

    			add_render_callback(() => {
    				if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, true);
    				div_transition.run(1);
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(fa.$$.fragment, local);
    			if (!div_transition) div_transition = create_bidirectional_transition(div, fade, {}, false);
    			div_transition.run(0);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(fa);
    			if (detaching && div_transition) div_transition.end();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(68:1) {#if scrolly > 100}",
    		ctx
    	});

    	return block;
    }

    // (75:1) <Drawer {open} on:clickAway={() => (open = false)} size="null">
    function create_default_slot(ctx) {
    	let div;
    	let button;
    	let period;
    	let depart;
    	let viewformat;
    	let current;
    	let mounted;
    	let dispose;
    	period = new Period({ $$inline: true });

    	depart = new Depart({
    			props: { state_drawer: /*TurnDrawer*/ ctx[6] },
    			$$inline: true
    		});

    	viewformat = new Viewformat({
    			props: { changeformat: /*ToggleSwitch*/ ctx[7] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			create_component(period.$$.fragment);
    			create_component(depart.$$.fragment);
    			create_component(viewformat.$$.fragment);
    			attr_dev(button, "class", "delete is-medium svelte-1e6r1wb");
    			add_location(button, file, 76, 3, 1817);
    			attr_dev(div, "class", "notification");
    			add_location(div, file, 75, 2, 1787);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, button);
    			mount_component(period, div, null);
    			mount_component(depart, div, null);
    			mount_component(viewformat, div, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(button, "click", /*click_handler*/ ctx[10], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(period.$$.fragment, local);
    			transition_in(depart.$$.fragment, local);
    			transition_in(viewformat.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(period.$$.fragment, local);
    			transition_out(depart.$$.fragment, local);
    			transition_out(viewformat.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(period);
    			destroy_component(depart);
    			destroy_component(viewformat);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(75:1) <Drawer {open} on:clickAway={() => (open = false)} size=\\\"null\\\">",
    		ctx
    	});

    	return block;
    }

    // (94:1) {:else}
    function create_else_block(ctx) {
    	let shahsched;
    	let current;
    	shahsched = new Shahsched({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(shahsched.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(shahsched, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(shahsched.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(shahsched.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(shahsched, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(94:1) {:else}",
    		ctx
    	});

    	return block;
    }

    // (92:21) 
    function create_if_block_1(ctx) {
    	let schedule;
    	let current;
    	schedule = new Schedule({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(schedule.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(schedule, target, anchor);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(schedule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(schedule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(schedule, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(92:21) ",
    		ctx
    	});

    	return block;
    }

    // (88:1) {#if $err_sched_data}
    function create_if_block(ctx) {
    	let div;
    	let errschedule;
    	let current;

    	errschedule = new Errschedule({
    			props: { errmessage: /*$err_sched_data*/ ctx[4] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			div = element("div");
    			create_component(errschedule.$$.fragment);
    			add_location(div, file, 88, 2, 2092);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			mount_component(errschedule, div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const errschedule_changes = {};
    			if (dirty & /*$err_sched_data*/ 16) errschedule_changes.errmessage = /*$err_sched_data*/ ctx[4];
    			errschedule.$set(errschedule_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(errschedule.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(errschedule.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_component(errschedule);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(88:1) {#if $err_sched_data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let scrolling = false;

    	let clear_scrolling = () => {
    		scrolling = false;
    	};

    	let scrolling_timeout;
    	let t0;
    	let main;
    	let resizeobserver;
    	let t1;
    	let t2;
    	let header;
    	let t3;
    	let drawer;
    	let t4;
    	let progbar;
    	let t5;
    	let startmessage;
    	let t6;
    	let current_block_type_index;
    	let if_block1;
    	let current;
    	let mounted;
    	let dispose;
    	add_render_callback(/*onwindowscroll*/ ctx[8]);
    	resizeobserver = new ResizeObserver_1({ $$inline: true });
    	resizeobserver.$on("resize", /*resize_handler*/ ctx[9]);
    	let if_block0 = /*scrolly*/ ctx[2] > 100 && create_if_block_2(ctx);

    	header = new Header({
    			props: { onBurgerClick: /*TurnDrawer*/ ctx[6] },
    			$$inline: true
    		});

    	drawer = new Drawer({
    			props: {
    				open: /*open*/ ctx[0],
    				size: "null",
    				$$slots: { default: [create_default_slot] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	drawer.$on("clickAway", /*clickAway_handler*/ ctx[11]);
    	progbar = new Progbar({ $$inline: true });

    	startmessage = new Startmessage({
    			props: { openDrawer: /*TurnDrawer*/ ctx[6] },
    			$$inline: true
    		});

    	const if_block_creators = [create_if_block, create_if_block_1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*$err_sched_data*/ ctx[4]) return 0;
    		if (/*showtable*/ ctx[1]) return 1;
    		return 2;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			t0 = space();
    			main = element("main");
    			create_component(resizeobserver.$$.fragment);
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			create_component(header.$$.fragment);
    			t3 = space();
    			create_component(drawer.$$.fragment);
    			t4 = space();
    			create_component(progbar.$$.fragment);
    			t5 = space();
    			create_component(startmessage.$$.fragment);
    			t6 = space();
    			if_block1.c();
    			document_1.title = "Расписание преподавателей";
    			attr_dev(main, "class", "container  is-widescreen svelte-1e6r1wb");
    			set_style(main, "min-height", "100vh");
    			add_location(main, file, 60, 0, 1336);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(resizeobserver, main, null);
    			append_dev(main, t1);
    			if (if_block0) if_block0.m(main, null);
    			append_dev(main, t2);
    			mount_component(header, main, null);
    			append_dev(main, t3);
    			mount_component(drawer, main, null);
    			append_dev(main, t4);
    			mount_component(progbar, main, null);
    			append_dev(main, t5);
    			mount_component(startmessage, main, null);
    			append_dev(main, t6);
    			if_blocks[current_block_type_index].m(main, null);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(window, "scroll", () => {
    					scrolling = true;
    					clearTimeout(scrolling_timeout);
    					scrolling_timeout = setTimeout(clear_scrolling, 100);
    					/*onwindowscroll*/ ctx[8]();
    				});

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*scrolly*/ 4 && !scrolling) {
    				scrolling = true;
    				clearTimeout(scrolling_timeout);
    				scrollTo(window.pageXOffset, /*scrolly*/ ctx[2]);
    				scrolling_timeout = setTimeout(clear_scrolling, 100);
    			}

    			if (/*scrolly*/ ctx[2] > 100) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);

    					if (dirty & /*scrolly*/ 4) {
    						transition_in(if_block0, 1);
    					}
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(main, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			const drawer_changes = {};
    			if (dirty & /*open*/ 1) drawer_changes.open = /*open*/ ctx[0];

    			if (dirty & /*$$scope, open*/ 4097) {
    				drawer_changes.$$scope = { dirty, ctx };
    			}

    			drawer.$set(drawer_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block1 = if_blocks[current_block_type_index];

    				if (!if_block1) {
    					if_block1 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block1.c();
    				} else {
    					if_block1.p(ctx, dirty);
    				}

    				transition_in(if_block1, 1);
    				if_block1.m(main, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(resizeobserver.$$.fragment, local);
    			transition_in(if_block0);
    			transition_in(header.$$.fragment, local);
    			transition_in(drawer.$$.fragment, local);
    			transition_in(progbar.$$.fragment, local);
    			transition_in(startmessage.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(resizeobserver.$$.fragment, local);
    			transition_out(if_block0);
    			transition_out(header.$$.fragment, local);
    			transition_out(drawer.$$.fragment, local);
    			transition_out(progbar.$$.fragment, local);
    			transition_out(startmessage.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			destroy_component(resizeobserver);
    			if (if_block0) if_block0.d();
    			destroy_component(header);
    			destroy_component(drawer);
    			destroy_component(progbar);
    			destroy_component(startmessage);
    			if_blocks[current_block_type_index].d();
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
    	let $err_sched_data;
    	validate_store(err_sched_data, "err_sched_data");
    	component_subscribe($$self, err_sched_data, $$value => $$invalidate(4, $err_sched_data = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let open = false;

    	const scrollToTop = () => {
    		let dp = document.getElementById("header");

    		if (dp) {
    			dp.scrollIntoView({ block: "start", behavior: "smooth" });
    		}
    	};

    	const TurnDrawer = () => {
    		$$invalidate(0, open = !open);
    	};

    	let showtable = true;

    	const ToggleSwitch = frm => {
    		$$invalidate(1, showtable = frm);
    	};

    	let scrolly = 5;
    	let w;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function onwindowscroll() {
    		$$invalidate(2, scrolly = window.pageYOffset);
    	}

    	const resize_handler = e => {
    		$$invalidate(3, w = e.detail.clientWidth);
    		client_width.update(() => w);
    	};

    	const click_handler = () => $$invalidate(0, open = false);
    	const clickAway_handler = () => $$invalidate(0, open = false);

    	$$self.$capture_state = () => ({
    		client_width,
    		err_sched_data,
    		fade,
    		Header,
    		StartMessage: Startmessage,
    		Period,
    		Depart,
    		Schedule,
    		ShahSched: Shahsched,
    		Progbar,
    		Drawer,
    		ViewFormat: Viewformat,
    		ResizeObserver: ResizeObserver_1,
    		Errschedule,
    		open,
    		Fa,
    		faArrowCircleUp,
    		scrollToTop,
    		TurnDrawer,
    		showtable,
    		ToggleSwitch,
    		scrolly,
    		w,
    		$err_sched_data
    	});

    	$$self.$inject_state = $$props => {
    		if ("open" in $$props) $$invalidate(0, open = $$props.open);
    		if ("showtable" in $$props) $$invalidate(1, showtable = $$props.showtable);
    		if ("scrolly" in $$props) $$invalidate(2, scrolly = $$props.scrolly);
    		if ("w" in $$props) $$invalidate(3, w = $$props.w);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		open,
    		showtable,
    		scrolly,
    		w,
    		$err_sched_data,
    		scrollToTop,
    		TurnDrawer,
    		ToggleSwitch,
    		onwindowscroll,
    		resize_handler,
    		click_handler,
    		clickAway_handler
    	];
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
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
