/*
	Copyright: Deux Huit Huit 2014
	License: MIT, see the LICENCE file
*/

/**
 * JS for entry relationship field
 */

/* Settings behavior */
(function ($, S) {
	
	'use strict';
	
	var baseurl = function () {
		return S.Context.get('symphony');
	};
	
	var INSTANCES_SEL = '.field-entry_relationship.instance';
	var SECTIONS_SEL = ' .entry_relationship-sections';
	var FIELD_CHOICES_SEL = ' .entry_relationship-field-choices';
	var ELEMENTS_SEL = ' .entry_relationship-elements';
	
	var SECTIONS = baseurl() + '/extension/entry_relationship_field/sectionsinfos/';
	
	var instances = $();
	
	var refreshInstances = function (context) {
		instances = context.find();
	};
	
	var updateElementsNameVisibility = function (field) {
		var fieldElements = field.find(ELEMENTS_SEL);
		var fieldChoices = field.find(FIELD_CHOICES_SEL);
		var values = {};
		
		// parse input
		$.each(fieldElements.val().split(','), function (index, value) {
			value = value.replace(/\s/gi, '');
			var parts = value.split('.');
			if (!!parts.length) {
				var sectionname = parts[0];
				var fieldname = parts[1];
				
				// skip all included
				if (values[sectionname] === true) {
					return true;
				}
				// set all included
				else if (fieldname === '*' || !fieldname) {
					values[sectionname] = true;
					return true;
				}
				// first time seeing this section
				else if (!values[sectionname]) {
					values[sectionname] = [];
				}
				// add current value
				values[sectionname].push(sectionname + '.' + fieldname);
			}
		});
		
		// show/hide
		fieldChoices.find('>li').each(function (index, value) {
			var t = $(this);
			var sectionname = t.attr('data-section');
			var field = t.text();
			var fx = 'show';
			if (values[sectionname] === true || !!~$.inArray(field, values[sectionname])) {
				fx = 'hide';
			}
			t[fx]();
		});
	};
	
	var createElementInstance = function (section, text) {
		var li = $('<li />')
			.attr('data-section', section.handle)
			.text(text);
		
		return li;
	};
	
	var resizeField = function (field, fieldChoices) {
		var maxHeight = 0;
		if (!field.is('.collapsed')) {
			fieldChoices = fieldChoices || field.find(FIELD_CHOICES_SEL);
			field.css('max-height', '+=' + fieldChoices.outerHeight(true) + 'px');
			maxHeight = parseInt(field.css('max-height'));
		} else {
			var temp = field.css('max-height');
			field.css('max-height', '').height();
			maxHeight = field.height();
			field.css('max-height', temp);
		}
		// update duplicator (collapsible) cached values
		field.data('heightMax', maxHeight);
	};
	
	var renderElementsName = function (field) {
		var sections = field.find(SECTIONS_SEL);
		var fieldChoices = field.find(FIELD_CHOICES_SEL);
		var temp = $();
		var values = [];
		
		sections.find('option:selected').each(function (index, value) {
			values.push($(value).val());
		});
		
		fieldChoices.empty();
		
		$.get(SECTIONS + values.join(',') + '/').done(function (data) {
			if (!!data.sections) {
				$.each(data.sections, function (index, section) {
					temp = temp.add(createElementInstance(section, section.handle + '.*'));
					$.each(section.fields, function (index, field) {
						var li = createElementInstance(section, section.handle + '.' + field.handle);
						temp = temp.add(li);
					});
				});
			}
			
			fieldChoices.append(temp);
			
			resizeField(field, fieldChoices);
			
			updateElementsNameVisibility(field);
		});
	};
	
	var init = function () {
		var body = $('body');
		if (body.is('#blueprints-sections') && (body.hasClass('edit') || body.hasClass('new'))) {
			$('#fields-duplicator').on('constructshow.duplicator, destructstart.duplicator', function (e) {
				var t = $(this);
				refreshInstances(t);
			}).on('change', INSTANCES_SEL + SECTIONS_SEL, function () {
				var t = $(this);
				var parent = t.closest(INSTANCES_SEL);
				renderElementsName(parent);
			}).on('click', INSTANCES_SEL + FIELD_CHOICES_SEL + '>li', function () {
				var t = $(this);
				var parent = t.closest(INSTANCES_SEL);
				var elements = parent.find(ELEMENTS_SEL);
				var val = elements.val() || '';
				if (!!val) {
					val += ', ';
				}
				val += t.text();
				elements.val(val);
				updateElementsNameVisibility(parent);
			}).on('keyup', ELEMENTS_SEL, function () {
				var t = $(this);
				var parent = t.closest(INSTANCES_SEL);
				updateElementsNameVisibility(parent);
			}).find(INSTANCES_SEL).each(function (index, elem) {
				setTimeout(function () {
					renderElementsName($(elem));
				}, 100);
			});
		}
	};
	
	$(init);
	
})(jQuery, Symphony);