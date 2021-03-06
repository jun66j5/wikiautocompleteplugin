jQuery(document).ready(function($) {
    function escape_newvalue(value) {
        return value.replace(/\$/g, '$$$$');
    }

    function search(strategy) {
        return function (term, callback) {
            var data = {q: term};
            if (strategy === 'attachment') {
                data.realm = wikiautocomplete.realm;
                data.id = wikiautocomplete.id;
            }
            $.getJSON(wikiautocomplete.url + '/' + strategy, data)
                .done(function (resp) { callback(resp); })
                .fail(function () { callback([]); });
        };
    }

    function template(text, term) {
        return $.htmlEscape(text);
    }

    var TextareaAdapter = $.fn.textcomplete.Textarea;
    function Adapter(element, completer, option) {
        this.initialize(element, completer, option);
    }
    $.extend(Adapter.prototype, TextareaAdapter.prototype, {
        _skipSearchOrig: TextareaAdapter.prototype._skipSearch,
        _skipSearch: function (clickEvent) {
            if (clickEvent.keyCode === 9)
                return;  // do not skip TAB key
            return this._skipSearchOrig(clickEvent);
        }
    });

    $('textarea.wikitext').textcomplete([
        { // Attachment
            match: /(\b(?:raw-)?attachment:|\[\[Image\()(\S*)$/,
            search: search('attachment'),
            index: 2,
            template: template,
            replace: function (name) {
                if (/\s/.test(name))
                    name = '"' + name + '"';
                return '$1' + escape_newvalue(name);
            },
            cache: true
        },

        { // Processors
            match: /^(\s*\{{3}#!)(.*)(?!\n)$/m,
            search: search('processor'),
            index: 2,
            template: function (processor) {
                switch (processor.type) {
                case 'macro':
                    return processor.name + ' ' + processor.description;
                case 'mimetype':
                    return $.htmlEscape(processor.name);
                }
            },
            replace: function (processor) {
                return '$1' + escape_newvalue(processor.name);
            },
            cache: true
        },

        { // TracLinks
            match: /(^|[^[])\[(\w*)$/,
            search: search('linkresolvers'),
            index: 2,
            template: template,
            replace: function (resolver) {
                return ['$1[' + escape_newvalue(resolver) + ':', ']'];
            },
            cache: true,
        },

        { // Tickets
            match: /((?:^|[^{])#|\bticket:)(\d*)$/,
            search: search('ticket'),
            index: 2,
            template: function (ticket) {
                return $.htmlEscape('#' + ticket.id + ' ' + ticket.summary);
            },
            replace: function (ticket) {
                return '$1' + ticket.id;
            },
            cache: true,
        },

        { // Wiki pages
            match: /\bwiki:(\S*)$/,
            search: search('wikipage'),
            index: 1,
            template: template,
            replace: function (wikipage) {
                return 'wiki:' + escape_newvalue(wikipage);
            },
            cache: true,
        },

        { // Macros
            match: /\[\[(\w*)(?:\(([^)]*))?$/,
            search: search('macro'),
            index: 1,
            template: function (macro) {
                return macro.name + ' ' + macro.description;
            },
            replace: function (macro) {
                return ['[[' + macro.name + '($2',')]]'];
            },
            cache: true,
        },

        { // Source
            match: /\b(source:|log:)([^@\s]*(?:@\S*)?)$/,
            search: search('source'),
            index: 2,
            template: template,
            replace: function (path) {
                return '$1' + escape_newvalue(path);
            },
            cache: true,
        },

        { // Milestone
            match: /\bmilestone:(\S*)$/,
            search: search('milestone'),
            index: 1,
            template: template,
            replace: function (name) {
                if (/\s/.test(name))
                    name = '"' + name + '"';
                return 'milestone:' + escape_newvalue(name);
            },
            cache: true
        },

        { // Report - {\d+}
            match: /(^|[^{])\{(\d*)$/,
            search: search('report'),
            index: 2,
            template: function (report) {
                return $.htmlEscape('{' + report.id + '} ' + report.title);
            },
            replace: function (report) {
                return ['$1{' + report.id, '}'];
            },
            cache: true
        },

        { // Report - report:\d+
            match: /\breport:(\d*)$/,
            search: search('report'),
            index: 1,
            template: function (report) {
                return $.htmlEscape('{' + report.id + '} ' + report.title);
            },
            replace: function (report) {
                return 'report:' + report.id;
            },
            cache: true
        }

    ], {
        appendTo: $('body'),
        adapter: Adapter,
        maxCount: 10000
    });

    if (/^1\.[78]\./.test($.fn.jquery) && $.browser.mozilla &&
        navigator.userAgent.indexOf('like Gecko') === -1 /* is not IE 11 */)
    {
        var margin = $('body').css('margin-top');
        if (margin && margin !== '0px') {
            if (!/px$/.test(margin))
                margin += 'px';
            $('<style type="text/css">.dropdown-menu { margin-top: ' +
              margin + ' !important }</style>').appendTo('head');
        }
    }
});
