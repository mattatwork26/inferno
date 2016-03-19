/*!
 * inferno-dom v0.6.0
 * (c) 2016 Dominic Gannaway
 * Released under the MPL-2.0 License.
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.InfernoDOM = factory());
}(this, function () { 'use strict';

	var babelHelpers = {};
	babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
	  return typeof obj;
	} : function (obj) {
	  return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj;
	};

	babelHelpers.classCallCheck = function (instance, Constructor) {
	  if (!(instance instanceof Constructor)) {
	    throw new TypeError("Cannot call a class as a function");
	  }
	};

	babelHelpers.createClass = function () {
	  function defineProperties(target, props) {
	    for (var i = 0; i < props.length; i++) {
	      var descriptor = props[i];
	      descriptor.enumerable = descriptor.enumerable || false;
	      descriptor.configurable = true;
	      if ("value" in descriptor) descriptor.writable = true;
	      Object.defineProperty(target, descriptor.key, descriptor);
	    }
	  }

	  return function (Constructor, protoProps, staticProps) {
	    if (protoProps) defineProperties(Constructor.prototype, protoProps);
	    if (staticProps) defineProperties(Constructor, staticProps);
	    return Constructor;
	  };
	}();

	babelHelpers.extends = Object.assign || function (target) {
	  for (var i = 1; i < arguments.length; i++) {
	    var source = arguments[i];

	    for (var key in source) {
	      if (Object.prototype.hasOwnProperty.call(source, key)) {
	        target[key] = source[key];
	      }
	    }
	  }

	  return target;
	};

	babelHelpers;

	// TODO! Use object literal or at least prototype? --- class is prototype (jsperf needed for perf verification)

	var Lifecycle = function () {
		function Lifecycle() {
			babelHelpers.classCallCheck(this, Lifecycle);

			this._listeners = [];
		}

		babelHelpers.createClass(Lifecycle, [{
			key: "addListener",
			value: function addListener(callback) {
				this._listeners.push(callback);
			}
		}, {
			key: "trigger",
			value: function trigger() {
				for (var i = 0; i < this._listeners.length; i++) {
					this._listeners[i]();
				}
			}
		}]);
		return Lifecycle;
	}();

	function addChildrenToProps(children, props) {
		if (!isNullOrUndefined(children)) {
			var isChildrenArray = isArray(children);
			if (isChildrenArray && children.length > 0 || !isChildrenArray) {
				if (props) {
					props.children = children;
				} else {
					props = {
						children: children
					};
				}
			}
		}
		return props;
	}

	function isArray(obj) {
		return obj.constructor === Array;
	}

	function isStatefulComponent(obj) {
		return !isNullOrUndefined(obj) && !isNullOrUndefined(obj.prototype.render);
	}

	function isStringOrNumber(obj) {
		return typeof obj === 'string' || typeof obj === 'number';
	}

	function isNullOrUndefined(obj) {
		return obj === undefined || obj === null;
	}

	function isInvalidNode(obj) {
		return obj === undefined || obj === null || obj === false;
	}

	function isFunction(obj) {
		return typeof obj === 'function';
	}

	function isAttrAnEvent(attr) {
		return attr[0] === 'o' && attr[1] === 'n' && attr.length > 3;
	}

	function isString(obj) {
		return typeof obj === 'string';
	}

	function isNumber(obj) {
		return typeof obj === 'number';
	}

	function isPromise(obj) {
		return obj instanceof Promise;
	}

	var delegatedEventsRegistry = {};

	// The issue with this, is that we can't stop the bubbling as we're traversing down the node tree, rather than up it
	// needs a rethink here
	function scanNodeList(node, target, delegatedEvent, callbackEvent) {
		if (node.dom === target) {
			delegatedEvent.callback(callbackEvent);
			return true;
		}
		var children = node.children;

		if (children) {
			if (isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					var child = children[i];

					if ((typeof child === 'undefined' ? 'undefined' : babelHelpers.typeof(child)) === 'object') {
						var result = scanNodeList(child, target, delegatedEvent, callbackEvent);

						if (result) {
							return true;
						}
					}
				}
			} else if (children.dom) {
				var _result = scanNodeList(children, target, delegatedEvent, callbackEvent);

				if (_result) {
					return true;
				}
			}
		}
	}

	function createEventListener(callbackEvent) {
		var delegatedEvents = delegatedEventsRegistry[callbackEvent.type];

		for (var i = delegatedEvents.length - 1; i > -1; i--) {
			var delegatedEvent = delegatedEvents[i];
			var node = delegatedEvent.node;
			var target = callbackEvent.target;

			scanNodeList(node, target, delegatedEvent, callbackEvent);
		}
	}

	function removeEventFromRegistry(event, callback) {
		if (isNullOrUndefined(callback)) {
			return;
		}
		var delegatedEvents = delegatedEventsRegistry[event];
		if (!isNullOrUndefined(delegatedEvents)) {
			for (var i = 0; i < delegatedEvents.length; i++) {
				var delegatedEvent = delegatedEvents[i];
				if (delegatedEvent.callback === callback) {
					delegatedEvents.splice(i, 1);
					return;
				}
			}
		}
	}

	function addEventToRegistry(event, node, callback) {
		var delegatedEvents = delegatedEventsRegistry[event];
		if (isNullOrUndefined(delegatedEvents)) {
			document.addEventListener(event, createEventListener, false);
			delegatedEventsRegistry[event] = [{
				callback: callback,
				node: node
			}];
		} else {
			delegatedEvents.push({
				callback: callback,
				node: node
			});
		}
	}

	var MathNamespace = 'http://www.w3.org/1998/Math/MathML';
	var SVGNamespace = 'http://www.w3.org/2000/svg';

	function insertOrAppend(parentDom, newNode, nextNode) {
		if (isNullOrUndefined(nextNode)) {
			parentDom.appendChild(newNode);
		} else {
			parentDom.insertBefore(newNode, nextNode);
		}
	}

	function createElement(tag, namespace) {
		if (isNullOrUndefined(namespace)) {
			return document.createElement(tag);
		} else {
			return document.createElementNS(namespace, tag);
		}
	}

	function appendText(text, parentDom, singleChild) {
		if (singleChild) {
			if (text !== '') {
				parentDom.textContent = text;
			} else {
				parentDom.appendChild(document.createTextNode(''));
			}
		} else {
			var textNode = document.createTextNode(text);

			parentDom.appendChild(textNode);
		}
	}

	function replaceNode(lastNode, nextNode, parentDom, namespace, lifecycle, context, instance) {
		if (isStringOrNumber(nextNode)) {
			var dom = document.createTextNode(nextNode);
			parentDom.replaceChild(dom, dom);
		} else if (isStringOrNumber(lastNode)) {
			var _dom = mountNode(nextNode, null, namespace, lifecycle, context, instance);
			nextNode.dom = _dom;
			parentDom.replaceChild(_dom, parentDom.firstChild);
		} else {
			var _dom2 = mountNode(nextNode, null, namespace, lifecycle, context, instance);
			nextNode.dom = _dom2;
			parentDom.replaceChild(_dom2, lastNode.dom);
		}
	}

	function detachNode(node) {
		if (isInvalidNode(node)) {
			return;
		}
		var instance = node.instance;
		if (!isNullOrUndefined(instance) && instance.render !== undefined) {
			instance.componentWillUnmount();
			instance._unmounted = true;
		}
		var hooks = node.hooks;
		if (!isNullOrUndefined(hooks)) {
			if (!isNullOrUndefined(hooks.willDetach)) {
				hooks.willDetach(node.dom);
			}
			if (!isNullOrUndefined(hooks.componentWillUnmount)) {
				hooks.componentWillUnmount(node.dom, hooks);
			}
		}
		var events = node.events;
		// Remove all events to free memory
		if (!isNullOrUndefined(events)) {
			for (var event in events) {
				removeEventFromRegistry(event, events[event]);
			}
		}

		var children = node.children;
		if (!isNullOrUndefined(children)) {
			if (isArray(children)) {
				for (var i = 0; i < children.length; i++) {
					detachNode(children[i]);
				}
			} else {
				detachNode(children);
			}
		}
	}

	function remove(node, parentDom) {
		detachNode(node);
		var dom = node.dom;
		if (dom === parentDom) {
			dom.innerHTML = '';
		} else {
			parentDom.removeChild(dom);
			if (recyclingEnabled) {
				pool(node);
			}
		}
	}

	// Checks if property is boolean type
	function booleanProps(prop) {
		switch (prop.length) {
			case 5:
				return prop === 'value';
			case 7:
				return prop === 'checked';
			case 8:
				return prop === 'disabled' || prop === 'selected';
			default:
				return false;
		}
	}

	function patchNode(lastNode, nextNode, parentDom, namespace, lifecycle, context, instance) {
		if (isInvalidNode(lastNode)) {
			mountNode(nextNode, parentDom, namespace, lifecycle, context, instance);
			return;
		}
		if (isInvalidNode(nextNode)) {
			remove(lastNode, parentDom);
			return;
		}
		diffNodes(lastNode, nextNode, parentDom, namespace, lifecycle, context, lastNode.tpl !== null && nextNode.tpl !== null, instance);
	}

	var canBeUnitlessProperties = {
		animationIterationCount: true,
		boxFlex: true,
		boxFlexGroup: true,
		columnCount: true,
		counterIncrement: true,
		fillOpacity: true,
		flex: true,
		flexGrow: true,
		flexOrder: true,
		flexPositive: true,
		flexShrink: true,
		float: true,
		fontWeight: true,
		gridColumn: true,
		lineHeight: true,
		lineClamp: true,
		opacity: true,
		order: true,
		orphans: true,
		stopOpacity: true,
		strokeDashoffset: true,
		strokeOpacity: true,
		strokeWidth: true,
		tabSize: true,
		transform: true,
		transformOrigin: true,
		widows: true,
		zIndex: true,
		zoom: true
	};

	function patchStyle(lastAttrValue, nextAttrValue, dom) {
		if (isString(nextAttrValue)) {
			dom.style.cssText = nextAttrValue;
		} else if (isNullOrUndefined(lastAttrValue)) {
			if (!isNullOrUndefined(nextAttrValue)) {
				var styleKeys = Object.keys(nextAttrValue);

				for (var i = 0; i < styleKeys.length; i++) {
					var style = styleKeys[i];
					var value = nextAttrValue[style];

					if (isNumber(value) && !canBeUnitlessProperties[style]) {
						value = value + 'px';
					}
					dom.style[style] = value;
				}
			}
		} else if (isNullOrUndefined(nextAttrValue)) {
			dom.removeAttribute('style');
		} else {
			var _styleKeys = Object.keys(nextAttrValue);

			for (var _i = 0; _i < _styleKeys.length; _i++) {
				var _style = _styleKeys[_i];
				var _value = nextAttrValue[_style];

				if (isNumber(_value) && !canBeUnitlessProperties[_style]) {
					_value = _value + 'px';
				}
				dom.style[_style] = _value;
			}
			var lastStyleKeys = Object.keys(lastAttrValue);

			for (var _i2 = 0; _i2 < lastStyleKeys.length; _i2++) {
				var _style2 = lastStyleKeys[_i2];
				if (isNullOrUndefined(nextAttrValue[_style2])) {
					dom.style[_style2] = '';
				}
			}
		}
	}

	function patchAttribute(attrName, nextAttrValue, dom) {
		if (!isAttrAnEvent(attrName)) {
			if (booleanProps(attrName)) {
				dom[attrName] = nextAttrValue;
				return;
			}
			if (nextAttrValue === false || isNullOrUndefined(nextAttrValue)) {
				dom.removeAttribute(attrName);
			} else {
				var ns = null;

				if (attrName[5] === ':' && attrName.indexOf('xlink:') !== -1) {
					ns = 'http://www.w3.org/1999/xlink';
				}
				if (ns !== null) {
					dom.setAttributeNS(ns, attrName, nextAttrValue === true ? attrName : nextAttrValue);
				} else {
					dom.setAttribute(attrName, nextAttrValue === true ? attrName : nextAttrValue);
				}
			}
		}
	}

	function patchComponent(lastNode, Component, instance, lastProps, nextProps, nextHooks, nextChildren, parentDom, lifecycle, context) {
		nextProps = addChildrenToProps(nextChildren, nextProps);

		if (isStatefulComponent(Component)) {
			var prevProps = instance.props;
			var prevState = instance.state;
			var nextState = instance.state;

			var childContext = instance.getChildContext();
			if (!isNullOrUndefined(childContext)) {
				context = babelHelpers.extends({}, context, childContext);
			}
			instance.context = context;
			var nextNode = instance._updateComponent(prevState, nextState, prevProps, nextProps);

			if (!isNullOrUndefined(nextNode)) {
				diffNodes(lastNode, nextNode, parentDom, null, lifecycle, context, true, instance);
				lastNode.dom = nextNode.dom;
				instance._lastNode = nextNode;
			}
		} else {
			var shouldUpdate = true;
			var nextHooksDefined = !isNullOrUndefined(nextHooks);

			if (nextHooksDefined && !isNullOrUndefined(nextHooks.componentShouldUpdate)) {
				shouldUpdate = nextHooks.componentShouldUpdate(lastNode.dom, lastProps, nextProps);
			}
			if (shouldUpdate !== false) {
				if (nextHooksDefined && !isNullOrUndefined(nextHooks.componentWillUpdate)) {
					nextHooks.componentWillUpdate(lastNode.dom, lastProps, nextProps);
				}
				var _nextNode = Component(nextProps);
				var dom = lastNode.dom;
				_nextNode.dom = dom;

				diffNodes(instance, _nextNode, dom, null, lifecycle, context, true, null);
				lastNode.instance = _nextNode;
				if (nextHooksDefined && !isNullOrUndefined(nextHooks.componentDidUpdate)) {
					nextHooks.componentDidUpdate(lastNode.dom, lastProps, nextProps);
				}
			}
		}
	}

	function patchNonKeyedChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, offset, instance) {
		var lastChildrenLength = lastChildren.length;
		var nextChildrenLength = nextChildren.length;

		if (lastChildrenLength > nextChildrenLength) {
			var lastDomNode = void 0;
			while (lastChildrenLength !== nextChildrenLength) {
				var lastChild = lastChildren[lastChildrenLength - 1];

				if (!isInvalidNode(lastChild)) {
					dom.removeChild((lastDomNode = lastChild.dom) || lastDomNode && (lastDomNode = lastDomNode.previousSibling) || (lastDomNode = dom.lastChild));
				}
				lastChildrenLength--;
			}
		} else if (lastChildrenLength < nextChildrenLength) {
			var counter = 0;
			while (lastChildrenLength !== nextChildrenLength) {
				var nextChild = nextChildren[lastChildrenLength + counter];

				if (isInvalidNode(nextChild)) {
					// TODO implement
				} else {
						var node = mountNode(nextChild, null, namespace, lifecycle, context, instance);
						dom.appendChild(node);
					}
				nextChildrenLength--;
				counter++;
			}
		}
		var childNodes = void 0;

		for (var i = 0; i < nextChildrenLength; i++) {
			var _lastChild = lastChildren[i];
			var _nextChild = nextChildren[i];

			if (_lastChild !== _nextChild) {
				if (isInvalidNode(_nextChild)) {
					if (!isInvalidNode(_lastChild)) {
						childNodes = childNodes || dom.childNodes;
						var childNode = childNodes[i + offset];
						if (!isNullOrUndefined(childNode)) {
							childNodes[i + offset].textContent = '';
						}
					}
				} else {
					if (isInvalidNode(_lastChild)) {
						if (isStringOrNumber(_nextChild)) {
							childNodes = childNodes || dom.childNodes;
							var _childNode = childNodes[i + offset];
							if (isNullOrUndefined(_childNode)) {
								dom.appendChild(document.createTextNode(_nextChild));
							} else {
								_childNode.textContent = _nextChild;
							}
						} else {
							var _node = mountNode(_nextChild, null, namespace, lifecycle, context, instance);
							dom.replaceChild(_node, dom.childNodes[i]);
						}
					} else if ((typeof _nextChild === 'undefined' ? 'undefined' : babelHelpers.typeof(_nextChild)) === 'object') {
						if (isArray(_nextChild)) {
							if (isArray(_lastChild)) {
								patchArrayChildren(_lastChild, _nextChild, dom, namespace, lifecycle, context, i, instance);
							} else {
								patchNonKeyedChildren([_lastChild], _nextChild, dom, namespace, lifecycle, context, i, instance);
							}
						} else {
							patchNode(_lastChild, _nextChild, dom, namespace, lifecycle, context, instance);
						}
					} else {
						childNodes = childNodes || dom.childNodes;
						var _childNode2 = childNodes[i + offset];
						if (isNullOrUndefined(_childNode2)) {
							dom.appendChild(document.createTextNode(_nextChild));
						} else {
							_childNode2.textContent = _nextChild;
						}
					}
				}
			}
		}
	}

	function patchKeyedChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, offset, instance) {
		var nextChildrenLength = nextChildren.length;
		var lastChildrenLength = lastChildren.length;
		if (nextChildrenLength === 0 && lastChildrenLength >= 5) {
			if (recyclingEnabled) {
				for (var i = 0; i < lastChildrenLength; i++) {
					pool(lastChildren[i]);
				}
			}
			dom.textContent = '';
			return;
		}
		var oldItem = void 0;
		var stop = false;
		var startIndex = 0;
		var oldStartIndex = 0;
		var endIndex = nextChildrenLength - 1;
		var oldEndIndex = lastChildrenLength - 1;
		var oldStartItem = lastChildrenLength > 0 ? lastChildren[oldStartIndex] : null;
		var startItem = nextChildrenLength > 0 ? nextChildren[startIndex] : null;
		var endItem = void 0;
		var oldEndItem = void 0;
		var nextNode = void 0;

		// TODO don't read key too often
		outer: while (!stop && startIndex <= endIndex && oldStartIndex <= oldEndIndex) {
			stop = true;
			while (startItem.key === oldStartItem.key) {
				diffNodes(oldStartItem, startItem, dom, namespace, lifecycle, context, true, instance);
				startIndex++;
				oldStartIndex++;
				if (startIndex > endIndex || oldStartIndex > oldEndIndex) {
					break outer;
				} else {
					startItem = nextChildren[startIndex];
					oldStartItem = lastChildren[oldStartIndex];
					stop = false;
				}
			}
			endItem = nextChildren[endIndex];
			oldEndItem = lastChildren[oldEndIndex];
			while (endItem.key === oldEndItem.key) {
				diffNodes(oldEndItem, endItem, dom, namespace, lifecycle, context, true, instance);
				endIndex--;
				oldEndIndex--;
				if (startIndex > endIndex || oldStartIndex > oldEndIndex) {
					break outer;
				} else {
					endItem = nextChildren[endIndex];
					oldEndItem = lastChildren[oldEndIndex];
					stop = false;
				}
			}
			while (endItem.key === oldStartItem.key) {
				nextNode = endIndex + 1 < nextChildrenLength ? nextChildren[endIndex + 1].dom : null;
				diffNodes(oldStartItem, endItem, dom, namespace, lifecycle, context, true, instance);
				insertOrAppend(dom, endItem.dom, nextNode);
				endIndex--;
				oldStartIndex++;
				if (startIndex > endIndex || oldStartIndex > oldEndIndex) {
					break outer;
				} else {
					endItem = nextChildren[endIndex];
					oldStartItem = lastChildren[oldStartIndex];
					stop = false;
				}
			}
			while (startItem.key === oldEndItem.key) {
				nextNode = lastChildren[oldStartIndex].dom;
				diffNodes(oldEndItem, startItem, dom, namespace, lifecycle, context, true, instance);
				insertOrAppend(dom, startItem.dom, nextNode);
				startIndex++;
				oldEndIndex--;
				if (startIndex > endIndex || oldStartIndex > oldEndIndex) {
					break outer;
				} else {
					startItem = nextChildren[startIndex];
					oldEndItem = lastChildren[oldEndIndex];
					stop = false;
				}
			}
		}

		if (oldStartIndex > oldEndIndex) {
			if (startIndex <= endIndex) {
				if (endIndex + 1 < nextChildrenLength) {
					nextNode = nextChildren[endIndex + 1].dom;
				} else {
					var oldLastItem = lastChildren[oldEndIndex];
					if (isNullOrUndefined(oldLastItem)) {
						if (isNullOrUndefined(offset)) {
							nextNode = null;
						} else {
							nextNode = dom.childNodes[offset];
						}
					} else {
						// ParentDOM can contain more than one list, so get try to get last items nextSibling
						nextNode = oldLastItem.dom.nextSibling;
					}
				}
				for (; startIndex <= endIndex; startIndex++) {
					insertOrAppend(dom, mountNode(nextChildren[startIndex], null, namespace, lifecycle, context, instance), nextNode);
				}
			}
		} else if (startIndex > endIndex) {
			for (; oldStartIndex <= oldEndIndex; oldStartIndex++) {
				oldItem = lastChildren[oldStartIndex];
				remove(oldItem, dom);
			}
		} else {
			var oldItemsMap = [];

			for (var _i3 = oldStartIndex; _i3 <= oldEndIndex; _i3++) {
				oldItem = lastChildren[_i3];
				oldItemsMap[oldItem.key] = oldItem;
			}
			nextNode = endIndex + 1 < nextChildrenLength ? nextChildren[endIndex + 1] : null;

			for (var _i4 = endIndex; _i4 >= startIndex; _i4--) {
				var item = nextChildren[_i4];
				var key = item.key;
				oldItem = oldItemsMap[key];
				nextNode = isNullOrUndefined(nextNode) ? undefined : nextNode.dom; // Default to undefined instead null, because nextSibling in DOM is null
				if (oldItem === undefined) {
					insertOrAppend(dom, mountNode(item, null, namespace, lifecycle, context, instance), nextNode);
				} else {
					oldItemsMap[key] = null;
					diffNodes(oldItem, item, dom, namespace, lifecycle, context, true, instance);

					if (item.dom.nextSibling !== nextNode) {
						insertOrAppend(dom, item.dom, nextNode);
					}
				}
				nextNode = item;
			}
			for (var _i5 = oldStartIndex; _i5 <= oldEndIndex; _i5++) {
				oldItem = lastChildren[_i5];
				if (oldItemsMap[oldItem.key] !== null) {
					remove(oldItem, dom);
				}
			}
		}
	}

	function patchArrayChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, offset, instance) {
		var isKeyed = nextChildren.length && !isNullOrUndefined(nextChildren[0]) && !isNullOrUndefined(nextChildren[0].key) || lastChildren.length && !isNullOrUndefined(lastChildren[0]) && !isNullOrUndefined(lastChildren[0].key);

		if (isKeyed) {
			patchKeyedChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, offset, instance);
		} else {
			patchNonKeyedChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, offset, instance);
		}
	}

	function updateTextNode(dom, lastChildren, nextChildren) {
		if (isStringOrNumber(lastChildren)) {
			dom.firstChild.nodeValue = nextChildren;
		} else {
			dom.textContent = nextChildren;
		}
	}

	function diffChildren(lastNode, nextNode, dom, namespace, lifecycle, context, staticCheck, instance) {
		var nextChildren = nextNode.children;
		var lastChildren = lastNode.children;

		if (lastChildren === nextChildren) {
			return;
		}

		if (!isInvalidNode(lastChildren)) {
			if (!isInvalidNode(nextChildren)) {
				if (isArray(lastChildren)) {
					if (isArray(nextChildren)) {
						patchArrayChildren(lastChildren, nextChildren, dom, namespace, lifecycle, context, null, instance);
					} else {
						patchNonKeyedChildren(lastChildren, [nextChildren], dom, namespace, lifecycle, context, null, instance);
					}
				} else {
					if (isArray(nextChildren)) {
						patchNonKeyedChildren([lastChildren], nextChildren, dom, namespace, lifecycle, context, null, instance);
					} else if (isStringOrNumber(nextChildren)) {
						updateTextNode(dom, lastChildren, nextChildren);
					} else {
						diffNodes(lastChildren, nextChildren, dom, namespace, lifecycle, context, staticCheck, instance);
					}
				}
			} else {
				dom.textContent = '';
			}
		} else {
			if (isStringOrNumber(nextChildren)) {
				updateTextNode(dom, lastChildren, nextChildren);
			} else if (!isNullOrUndefined(nextChildren)) {
				if ((typeof nextChildren === 'undefined' ? 'undefined' : babelHelpers.typeof(nextChildren)) === 'object') {
					if (isArray(nextChildren)) {
						mountChildren(nextChildren, dom, namespace, lifecycle, context, instance);
					} else {
						mountNode(nextChildren, dom, namespace, lifecycle, context, instance);
					}
				}
			}
		}
	}

	function diffRef(instance, lastValue, nextValue, dom) {
		if (!isNullOrUndefined(instance)) {
			if (isString(lastValue)) {
				delete instance.refs[lastValue];
			}
			if (isString(nextValue)) {
				instance.refs[nextValue] = dom;
			}
		}
	}

	function diffAttributes(lastNode, nextNode, dom, instance) {
		var nextAttrs = nextNode.attrs;
		var lastAttrs = lastNode.attrs;
		var nextAttrsIsUndef = isNullOrUndefined(nextAttrs);
		var lastAttrsIsUndef = isNullOrUndefined(lastAttrs);

		if (!nextAttrsIsUndef) {
			var nextAttrsKeys = Object.keys(nextAttrs);
			var attrKeysLength = nextAttrsKeys.length;

			for (var i = 0; i < attrKeysLength; i++) {
				var attr = nextAttrsKeys[i];
				var lastAttrVal = !lastAttrsIsUndef && lastAttrs[attr];
				var nextAttrVal = nextAttrs[attr];

				if (lastAttrVal !== nextAttrVal) {
					if (attr === 'ref') {
						diffRef(instance, lastAttrVal, nextAttrVal, dom);
					} else {
						patchAttribute(attr, nextAttrVal, dom);
					}
				}
			}
		}
		if (!lastAttrsIsUndef) {
			var lastAttrsKeys = Object.keys(lastAttrs);
			var _attrKeysLength = lastAttrsKeys.length;

			for (var _i = 0; _i < _attrKeysLength; _i++) {
				var _attr = lastAttrsKeys[_i];

				if (nextAttrsIsUndef || isNullOrUndefined(nextAttrs[_attr])) {
					if (_attr === 'ref') {
						diffRef(instance, lastAttrs[_attr], null, dom);
					} else {
						dom.removeAttribute(_attr);
					}
				}
			}
		}
	}

	function diffEvents(lastNode, nextNode, dom) {
		var lastEvents = lastNode.events;

		if (!isNullOrUndefined(lastEvents)) {
			var nextEvents = nextNode.events;
			if (!isNullOrUndefined(nextEvents)) {
				var lastEventsKeys = Object.keys(lastEvents);
				// const nextEventsKeys = Object.keys(nextEvents);

				for (var i = 0; i < lastEventsKeys.length; i++) {
					var event = lastEventsKeys[i];
					var nextEvent = nextEvents[event];
					var lastEvent = lastEvents[event];

					if (isNullOrUndefined(nextEvent)) {
						removeEventFromRegistry(event, lastEvent);
					} else if (nextEvent !== lastEvent) {
						// TODO: feels lot of looping here, but also this is real edge case
						// Callback has changed and is not same as before
						removeEventFromRegistry(event, lastEvent); // remove old
						addEventToRegistry(event, nextNode, nextEvent); // add new
					}
				}
			}
		}
	}

	function diffNodes(lastNode, nextNode, parentDom, namespace, lifecycle, context, staticCheck, instance) {
		if (nextNode === false || nextNode === null) {
			return;
		}
		if (!isNullOrUndefined(nextNode.then)) {
			nextNode.then(function (node) {
				diffNodes(lastNode, node, parentDom, namespace, lifecycle, context, staticCheck, instance);
			});
			return;
		}
		if (isStringOrNumber(lastNode)) {
			if (isStringOrNumber(nextNode)) {
				parentDom.firstChild.nodeValue = nextNode;
			} else {
				replaceNode(lastNode, nextNode, parentDom, namespace, lifecycle, context, instance);
			}
			return;
		}
		var nextHooks = nextNode.hooks;
		if (!isNullOrUndefined(nextHooks) && !isNullOrUndefined(nextHooks.willUpdate)) {
			nextHooks.willUpdate(lastNode.dom);
		}
		var nextTag = nextNode.tag || (staticCheck && !isNullOrUndefined(nextNode.tpl) ? nextNode.tpl.tag : null);
		var lastTag = lastNode.tag || (staticCheck && !isNullOrUndefined(lastNode.tpl) ? lastNode.tpl.tag : null);

		namespace = namespace || nextTag === 'svg' ? SVGNamespace : nextTag === 'math' ? MathNamespace : null;
		if (lastTag !== nextTag) {
			if (isFunction(lastTag) && !isFunction(nextTag)) {
				if (isStatefulComponent(lastTag)) {
					diffNodes(lastNode.instance._lastNode, nextNode, parentDom, namespace, lifecycle, context, true, instance);
				} else {
					diffNodes(lastNode.instance, nextNode, parentDom, namespace, lifecycle, context, true, instance);
				}
			} else {
				replaceNode(lastNode, nextNode, parentDom, namespace, lifecycle, context, instance);
			}
			return;
		} else if (isNullOrUndefined(lastTag)) {
			nextNode.dom = lastNode.dom;
			return;
		}
		if (isFunction(lastTag) && isFunction(nextTag)) {
			nextNode.instance = lastNode.instance;
			nextNode.dom = lastNode.dom;
			patchComponent(nextNode, nextNode.tag, nextNode.instance, lastNode.attrs || {}, nextNode.attrs || {}, nextNode.hooks, nextNode.children, parentDom, lifecycle, context);
			return;
		}
		var dom = lastNode.dom;

		nextNode.dom = dom;
		diffChildren(lastNode, nextNode, dom, namespace, lifecycle, context, staticCheck, instance);
		var nextClassName = nextNode.className;
		var nextStyle = nextNode.style;

		if (lastNode.className !== nextClassName) {
			if (isNullOrUndefined(nextClassName)) {
				dom.removeAttribute('class');
			} else {
				dom.className = nextClassName;
			}
		}
		if (lastNode.style !== nextStyle) {
			patchStyle(lastNode.style, nextStyle, dom);
		}
		diffAttributes(lastNode, nextNode, dom, instance);
		diffEvents(lastNode, nextNode, dom);
		if (!isNullOrUndefined(nextHooks) && !isNullOrUndefined(nextHooks.didUpdate)) {
			nextHooks.didUpdate(dom);
		}
	}

	var recyclingEnabled = true;

	function recycle(node, lifecycle, context) {
		var tpl = node.tpl;

		if (!isNullOrUndefined(tpl)) {
			var key = node.key;
			var recycledNode = void 0;

			if (key !== null) {
				var keyPool = tpl.pools.keyed[key];
				recycledNode = keyPool && keyPool.pop();
			} else {
				var _keyPool = tpl.pools.nonKeyed;
				recycledNode = _keyPool && _keyPool.pop();
			}
			if (!isNullOrUndefined(recycledNode)) {
				diffNodes(recycledNode, node, null, null, lifecycle, context, true);
				return node.dom;
			}
		}
	}

	function pool(node) {
		var tpl = node.tpl;

		if (!isNullOrUndefined(tpl)) {
			var key = node.key;
			var pools = tpl.pools;

			if (key === null) {
				var _pool = pools.nonKeyed;
				_pool && _pool.push(node);
			} else {
				var _pool2 = pools.keyed;
				(_pool2[key] || (_pool2[key] = [])).push(node);
			}
		}
	}

	// TODO!  Need to be re-written to gain bette performance. I can't do it. K.F
	function mountChildren(children, parentDom, namespace, lifecycle, context, instance) {
		if (isArray(children)) {
			for (var i = 0; i < children.length; i++) {
				var child = children[i];

				if (isStringOrNumber(child)) {
					appendText(child, parentDom, false);
				} else if (!isNullOrUndefined(child) && isArray(child)) {
					mountChildren(child, parentDom, namespace, lifecycle, context, instance);
				} else if (isPromise(child)) {
					(function () {
						var placeholder = document.createTextNode('');

						child.then(function (node) {
							var dom = mountNode(node, null, namespace, lifecycle, context, instance);

							parentDom.replaceChild(dom, placeholder);
						});
						parentDom.appendChild(placeholder);
					})();
				} else {
					mountNode(child, parentDom, namespace, lifecycle, context, instance);
				}
			}
		} else {
			if (isStringOrNumber(children)) {
				appendText(children, parentDom, true);
			} else if (isPromise(children)) {
				(function () {
					var placeholder = document.createTextNode('');

					children.then(function (node) {
						var dom = mountNode(node, null, namespace, lifecycle, context, instance);

						parentDom.replaceChild(dom, placeholder);
					});
					parentDom.appendChild(placeholder);
				})();
			} else {
				mountNode(children, parentDom, namespace, lifecycle, context, instance);
			}
		}
	}

	function mountRef(instance, value, dom) {
		if (!isNullOrUndefined(instance) && isString(value)) {
			instance.refs[value] = dom;
		}
	}

	function mountComponent(parentNode, Component, props, hooks, children, parentDom, lifecycle, context) {
		props = addChildrenToProps(children, props);

		var dom = void 0;
		if (isStatefulComponent(Component)) {
			var instance = new Component(props);
			instance._diffNodes = diffNodes;

			var childContext = instance.getChildContext();
			if (!isNullOrUndefined(childContext)) {
				context = babelHelpers.extends({}, context, childContext);
			}
			instance.context = context;

			// Block setting state - we should render only once, using latest state
			instance._pendingSetState = true;
			instance.componentWillMount();
			var shouldUpdate = instance.shouldComponentUpdate();
			if (shouldUpdate) {
				instance.componentWillUpdate();
				var pendingState = instance._pendingState;
				var oldState = instance.state;
				instance.state = babelHelpers.extends({}, oldState, pendingState);
			}
			var _node = instance.render();
			instance._pendingSetState = false;

			if (!isNullOrUndefined(_node)) {
				dom = mountNode(_node, null, null, lifecycle, context, instance);
				instance._lastNode = _node;
				if (parentDom !== null) {
					// avoid DEOPT
					parentDom.appendChild(dom);
				}
				instance.componentDidMount();
				instance.componentDidUpdate();
			}

			parentNode.dom = dom;
			parentNode.instance = instance;
			return dom;
		}
		if (!isNullOrUndefined(hooks)) {
			if (!isNullOrUndefined(hooks.componentWillMount)) {
				hooks.componentWillMount(null, props);
			}
			if (!isNullOrUndefined(hooks.componentDidMount)) {
				lifecycle.addListener(function () {
					hooks.componentDidMount(dom, props);
				});
			}
		}

		/* eslint new-cap: 0 */
		var node = Component(props);
		dom = mountNode(node, null, null, lifecycle, context, null);

		parentNode.instance = node;

		if (parentDom !== null) {
			// avoid DEOPT
			parentDom.appendChild(dom);
		}
		parentNode.dom = dom;
		return dom;
	}

	function mountEvents(events, node) {
		var allEvents = Object.keys(events);

		for (var i = 0; i < allEvents.length; i++) {
			var event = allEvents[i];
			if (isString(event)) {
				addEventToRegistry(event, node, events[event]);
			}
		}
	}

	function placeholder(node, parentDom) {
		var dom = document.createTextNode('');

		if (parentDom !== null) {
			parentDom.appendChild(dom);
		}
		if (!isNullOrUndefined(node)) {
			node.dom = dom;
		}
		return dom;
	}

	function mountNode(node, parentDom, namespace, lifecycle, context, instance) {
		if (isInvalidNode(node) || isArray(node)) {
			return placeholder(node, parentDom);
		}

		var dom = void 0;
		if (isStringOrNumber(node)) {
			dom = document.createTextNode(node);

			if (parentDom !== null) {
				parentDom.appendChild(dom);
			}
			return dom;
		}
		if (recyclingEnabled) {
			dom = recycle(node, lifecycle, context);
			if (dom) {
				if (parentDom) {
					parentDom.appendChild(dom);
				}
				return dom;
			}
		}
		var tag = node.tag;

		if (tag === null) {
			return placeholder(node, parentDom);
		}
		if (isFunction(tag)) {
			return mountComponent(node, tag, node.attrs || {}, node.hooks, node.children, parentDom, lifecycle, context);
		}
		namespace = namespace || tag === 'svg' ? SVGNamespace : tag === 'math' ? MathNamespace : null;

		var tpl = node.tpl;
		if (!isNullOrUndefined(tpl) && !isNullOrUndefined(tpl.dom)) {
			dom = tpl.dom.cloneNode(true);
		} else {
			if (!isString(tag) || tag === '') {
				throw Error('Inferno Error: Expected function or string for element tag type');
			}
			dom = createElement(tag, namespace);
		}
		var children = node.children;
		var attrs = node.attrs;
		var events = node.events;
		var hooks = node.hooks;
		var className = node.className;
		var style = node.style;

		if (!isNullOrUndefined(hooks)) {
			if (!isNullOrUndefined(hooks.created)) {
				hooks.created(dom);
			}
			if (!isNullOrUndefined(hooks.attached)) {
				lifecycle.addListener(function () {
					hooks.attached(dom);
				});
			}
		}
		if (!isNullOrUndefined(events)) {
			mountEvents(events, node);
		}
		if (!isInvalidNode(children)) {
			mountChildren(children, dom, namespace, lifecycle, context, instance);
		}
		if (!isNullOrUndefined(attrs)) {
			mountAttributes(attrs, dom, instance);
		}
		if (!isNullOrUndefined(className)) {
			dom.className = className;
		}
		if (!isNullOrUndefined(style)) {
			patchStyle(null, style, dom);
		}
		node.dom = dom;
		if (parentDom !== null) {
			parentDom.appendChild(dom);
		}
		return dom;
	}

	function mountAttributes(attrs, dom, instance) {
		var attrsKeys = Object.keys(attrs);

		for (var i = 0; i < attrsKeys.length; i++) {
			var attr = attrsKeys[i];

			if (attr === 'ref') {
				mountRef(instance, attrs[attr], dom);
			} else {
				patchAttribute(attr, attrs[attr], dom);
			}
		}
	}

	var roots = [];

	function getRoot(parentDom) {
		for (var i = 0; i < roots.length; i++) {
			var root = roots[i];

			if (root.dom === parentDom) {
				return root;
			}
		}
		return null;
	}

	function removeRoot(rootNode) {
		for (var i = 0; i < roots.length; i++) {
			var root = roots[i];

			if (root === rootNode) {
				roots.splice(i, 1);
				return;
			}
		}
	}

	function render(node, parentDom) {
		var root = getRoot(parentDom);
		var lifecycle = new Lifecycle();

		if (root === null) {
			mountNode(node, parentDom, null, lifecycle, {}, null);
			lifecycle.trigger();
			roots.push({ node: node, dom: parentDom });
		} else {
			patchNode(root.node, node, parentDom, null, lifecycle, {}, null);
			lifecycle.trigger();
			if (node === null) {
				removeRoot(root);
			}
			root.node = node;
		}
	}

	var index = {
		render: render
	};

	return index;

}));