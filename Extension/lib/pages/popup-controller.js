/**
 * This file is part of Adguard Browser Extension (https://github.com/AdguardTeam/AdguardBrowserExtension).
 *
 * Adguard Browser Extension is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Adguard Browser Extension is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Adguard Browser Extension.  If not, see <http://www.gnu.org/licenses/>.
 */

/* global i18n, popupPage */

/**
 * Controller that manages add-on popup window
 */
var PopupController = function () {
};

PopupController.prototype = {

    /**
     * Renders popup using specified model object
     * @param tabInfo
     * @param options
     */
    render: function (tabInfo, options) {

        this.tabInfo = tabInfo;
        this.options = options || {};

        //render
        this._renderPopup(tabInfo);

        // Bind actions
        this._bindActions();

        this.afterRender();
    },

    resizePopupWindow: function () {
        //TODO: Remove jquery
        var $widjet = $('body>div:not(.hidden)');
        var width = $widjet.outerWidth();
        var height = $widjet.outerHeight();
        popupPage.resizePopup(width, height);
    },

    afterRender: function () {
        //Should be overwritten
    },

    addWhiteListDomain: function (url) {
        popupPage.sendMessage({type: 'addWhiteListDomainPopup', url: url});
    },

    removeWhiteListDomain: function (url) {
        popupPage.sendMessage({type: 'removeWhiteListDomainPopup', url: url});
    },

    changeApplicationFilteringDisabled: function (disabled) {
        popupPage.sendMessage({type: 'changeApplicationFilteringDisabled', disabled: disabled});
    },

    sendFeedback: function (url, topic, comment) {
        popupPage.sendMessage({type: 'sendFeedback', url: url, topic: topic, comment: comment});
    },

    openSiteReportTab: function (url) {
        popupPage.sendMessage({type: 'openSiteReportTab', url: url});
    },

    openAbuseTab: function (url) {
        popupPage.sendMessage({type: 'openAbuseTab', url: url});
    },

    openSettingsTab: function () {
        popupPage.sendMessage({type: 'openSettingsTab'});
    },

    openAssistantInTab: function () {
        popupPage.sendMessage({type: 'openAssistant'});
    },

    openFilteringLog: function (tabId) {
        popupPage.sendMessage({type: 'openFilteringLog', tabId: tabId});
    },

    resetBlockedAdsCount: function () {
        popupPage.sendMessage({type: 'resetBlockedAdsCount'});
    },

    openLink: function (url) {
        popupPage.sendMessage({type: 'openTab', url: url});
    },

    _renderPopup: function (tabInfo) {

        var parent = $('.widjet-popup');
        parent.find('.footer').remove();

        var stack = parent.find('.tabstack');

        var containerMain = parent.find('.tab-main');
        containerMain.empty();

        var containerStats = parent.find('.tab-statistics');
        containerStats.empty();

        stack.attr('class', 'tabstack');

        // Hide stats for integration mode
        if (tabInfo.adguardDetected) {
            parent.find('.tab-stats-button').hide();
            parent.find('.tab-main-button').width('100%');
        }

        // define class
        if (tabInfo.urlFilteringDisabled) {
            stack.addClass('status-error error-sad');
        } else if (tabInfo.applicationFilteringDisabled) {
            stack.addClass('status-paused');
        } else {
            if (!tabInfo.canAddRemoveRule) {
                stack.addClass('status-error error-filter');
            } else {
                if (tabInfo.documentWhiteListed) {
                    stack.addClass('status-cross');
                } else {
                    stack.addClass('status-checkmark');
                }
            }
        }

        // Header
        this.filteringIntegrationHeader = this._getTemplate('filtering-integration-header-template');
        this.filteringDefaultHeader = this._getTemplate('filtering-default-header-template');

        // Controls
        this.filteringControlDefault = this._getTemplate('filtering-default-control-template');
        this.filteringControlDisabled = this._getTemplate('filtering-disabled-control-template');
        this.filteringControlException = this._getTemplate('filtering-site-exception-control-template');

        // Actions
        this.actionOpenAssistant = this._getTemplate('action-open-assistant-template');
        this.actionOpenAbuse = this._getTemplate('action-open-abuse-template');
        this.actionOpenSiteReport = this._getTemplate('action-site-report-template');

        // Status Text
        this.filteringStatusText = this._getTemplate('filtering-status-template');
        // Message text
        this.filteringMessageText = this._getTemplate('filtering-message-template');

        // Stats
        this.filteringStatisticsTemplate = this._getTemplate('filtering-statistics-template');

        // Footer
        this.footerDefault = this._getTemplate('footer-default-template');
        this.footerIntegration = this._getTemplate('footer-integration-template');

        this._renderHeader(containerMain, tabInfo);
        this._renderFilteringControls(containerMain, tabInfo);
        this._renderStatus(containerMain, tabInfo);
        this._renderActions(containerMain, tabInfo);
        this._renderMessage(containerMain, tabInfo);
        this._renderStats(containerStats);
        this._renderFooter(parent, tabInfo);
    },

    _getTemplate: function (id) {
        return $('#' + id).children().clone();
    },

    _renderHeader: function (container, tabInfo) {

        function formatNumber(v) {
            return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        }

        var template;
        if (tabInfo.adguardDetected) {
            template = this.filteringIntegrationHeader;
        } else {
            template = this.filteringDefaultHeader;
            var tabBlocked = template.find('.blocked-tab');
            var totalBlocked = template.find('.blocked-all');
            i18n.translateElement(tabBlocked[0], 'popup_tab_blocked', [formatNumber(tabInfo.totalBlockedTab || 0)]);
            i18n.translateElement(totalBlocked[0], 'popup_tab_blocked_all', [formatNumber(tabInfo.totalBlocked || 0)]);
            if (tabInfo.totalBlocked >= 10000000) {
                tabBlocked.closest('.widjet-popup-filter').addClass('db');
            } else {
                tabBlocked.closest('.widjet-popup-filter').removeClass('db');
            }
        }

        container.append(template);
    },

    _renderFilteringControls: function (container, tabInfo) {
        var template = this.filteringControlDefault;

        if (tabInfo.urlFilteringDisabled) {
            template = this.filteringControlDisabled;
        } else if (tabInfo.applicationFilteringDisabled) { // jshint ignore:line
            // Use default template
        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                template = this.filteringControlException;
            }
        }

        if (tabInfo.urlFilteringDisabled || tabInfo.applicationFilteringDisabled || tabInfo.adguardDetected) {
            template.find('.pause').hide();
        }
        if (tabInfo.adguardDetected) {
            template.find('.settings').hide();
        }

        container.append(template);
    },

    _renderStatus: function (container, tabInfo) {

        var template = this.filteringStatusText;

        var text = '';

        if (tabInfo.urlFilteringDisabled) {
            text = 'popup_site_filtering_state_tab_unavailable';
        } else if (tabInfo.applicationFilteringDisabled) {
            text = 'popup_site_filtering_state_paused';
        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                text = 'popup_site_filtering_state_subscription_unavailable';
            } else {
                if (tabInfo.documentWhiteListed) {
                    text = 'popup_site_filtering_state_disabled';
                } else {
                    text = 'popup_site_filtering_state_enabled';
                }
            }
        }

        i18n.translateElement(template[0], text);

        container.append(template);
    },

    _renderMessage: function (container, tabInfo) {

        var text;

        if (tabInfo.urlFilteringDisabled) {
            text = 'popup_site_filtering_disabled';
        } else if (tabInfo.applicationFilteringDisabled) {

        } else {
            if (tabInfo.documentWhiteListed && !tabInfo.userWhiteListed) {
                text = 'popup_site_exception_info';
            }
        }

        var template = this.filteringMessageText;
        if (text) {
            i18n.translateElement(template[0], text);
            container.append(template);
        }
    },

    _selectRequestTypesStatsData: function (stats, range) {
        var result = {};

        switch (range) {
            case 'day':
                result = stats.lastMonth[stats.lastMonth.length - 1];
                break;
            case 'week':
                for (var i = 0; i < stats.lastWeek.length; i++) {
                    var d = stats.lastWeek[i];
                    for (var type in d) {
                        if (d[type]) {
                            result[type] = (result[type] ? result[type] : 0) + d[type];
                        }
                    }
                }
                break;
            case 'month':
                result = stats.lastYear[stats.lastYear.length - 1];
                break;
            case 'year':
                for (var i = 0; i < stats.lastYear.length; i++) {
                    var d = stats.lastYear[i];
                    for (var type in d) {
                        if (d[type]) {
                            result[type] = (result[type] ? result[type] : 0) + d[type];
                        }
                    }
                }
                break;
        }

        return result;
    },

    _selectBadRequestsStatsData: function (stats, range) {
        var result = [];

        switch (range) {
            case 'day':
                stats.today.forEach(function (d) {
                    result.push(d.total);
                });
                break;
            case 'week':
                stats.lastWeek.forEach(function (d) {
                    result.push(d.total);
                });
                break;
            case 'month':
                stats.lastMonth.forEach(function (d) {
                    result.push(d.total);
                });
                break;
            case 'year':
                stats.lastYear.forEach(function (d) {
                    result.push(d.total);
                });
                break;
        }

        return result;
    },

    DAYS_OF_WEEK: (function () {
        return this.DAYS_OF_WEEK || [
            i18n.getMessage("popup_statistics_week_days_mon"),
            i18n.getMessage("popup_statistics_week_days_tue"),
            i18n.getMessage("popup_statistics_week_days_wed"),
            i18n.getMessage("popup_statistics_week_days_thu"),
            i18n.getMessage("popup_statistics_week_days_fri"),
            i18n.getMessage("popup_statistics_week_days_sat"),
            i18n.getMessage("popup_statistics_week_days_sun")
        ];
    })(),

    _dayOfWeekAsString: function (dayIndex) {
        return this.DAYS_OF_WEEK[dayIndex];
    },

    MONTHS_OF_YEAR: (function () {
        return this.MONTHS_OF_YEAR || [
                i18n.getMessage("popup_statistics_months_jan"),
                i18n.getMessage("popup_statistics_months_feb"),
                i18n.getMessage("popup_statistics_months_mar"),
                i18n.getMessage("popup_statistics_months_apr"),
                i18n.getMessage("popup_statistics_months_may"),
                i18n.getMessage("popup_statistics_months_jun"),
                i18n.getMessage("popup_statistics_months_jul"),
                i18n.getMessage("popup_statistics_months_aug"),
                i18n.getMessage("popup_statistics_months_sep"),
                i18n.getMessage("popup_statistics_months_oct"),
                i18n.getMessage("popup_statistics_months_nov"),
                i18n.getMessage("popup_statistics_months_dec")
            ];
    })(),

    _monthsAsString: function (monthIndex) {
        return this.MONTHS_OF_YEAR[monthIndex];
    },

    _getCategoriesLines: function (statsData, range) {
        var now = new Date();
        var day = now.getDay();
        var month = now.getMonth();
        var lastDayOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();

        var categories = [];
        var lines = [];
        switch (range) {
            case 'day':
                for (var i = 0; i < 25; i++) {
                    if (i % 3 === 0) {
                        var hour = (i + now.getHours()) % 24;
                        categories.push(hour.toString());
                        lines.push({
                            value: i
                        });
                    } else {
                        categories.push('');
                    }
                }

                break;
            case 'week':
                for (var i = 0; i < 8; i++) {
                    categories.push(this._dayOfWeekAsString((day + i) % 7 ));
                    lines.push({
                        value: i
                    });
                }

                break;
            case 'month':
                for (var i = 0; i < 31; i++) {
                    if (i % 3 === 0) {
                        var c = (i + now.getDate()) % lastDayOfPrevMonth + 1;
                        categories.push(c.toString());
                        lines.push({
                            value: i
                        });
                    } else {
                        categories.push('');
                    }
                }

                break;
            case 'year':
                for (var i = 0; i < 13; i++) {
                    categories.push(this._monthsAsString((month + i) % 12 ));
                    categories = categories.slice(-statsData.length);
                    lines.push({
                        value: i
                    });
                }

                break;
        }

        return {
            categories: categories,
            lines: lines
        };
    },

    _renderBadRequestsGraphs: function (stats, range) {
        var statsData = this._selectBadRequestsStatsData(stats, range);
        var categoriesLines = this._getCategoriesLines(statsData, range);
        var categories = categoriesLines.categories;
        var lines = categoriesLines.lines;

        var grad1 =
            '<linearGradient id="grad1" x1="50%" y1="0%" x2="50%" y2="100%">'+
            '  <stop offset="0%" style="stop-color:#73BE66;stop-opacity:1" />'+
            '  <stop offset="23%" style="stop-color:#6DBE85;stop-opacity:1" />'+
            '  <stop offset="100%" style="stop-color:#65BDA8;stop-opacity:1" />'+
            '</linearGradient>';

        var chart = c3.generate({
            size: {
                height: 230
            },
            data: {
                columns: [
                    ['data1'].concat(statsData)
                ],
                types: {
                    data1: 'area-spline'
                },
                colors: {
                    data1: 'url(#grad1)'
                }
            },
            padding: {
                left: 15,
                right: 15
            },
            axis: {
                x: {
                    show: true,
                    type: 'category',
                    categories: categories,
                    tick: {
                        outer: false,
                        multiline: false
                    }
                },
                y: {
                    show: false
                }
            },
            legend: {
                show: false
            },
            grid: {
                x: {
                    lines: lines
                },
                focus: {
                    show: false
                }
            },
            spline: {
                interpolation: {
                    type: 'basis'
                }
            },
            point: {
                show: false
            },
            tooltip: {
                position: function(data, width, height, element) {
                    var top = d3.mouse(element)[1] - 50;
                    return {
                        top: top,
                        left: parseInt(element.getAttribute('x')) - 3
                    };
                },
                contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
                    d = d[0].value;
                    return '<div id="tooltip" class="chart__tooltip">' + d + '</div>';
                }
            },
            oninit: function() {
                this.svg[0][0].getElementsByTagName('defs')[0].innerHTML += grad1;
            }
        });
    },

    _localizeBlockedType: function (type) {
        if (!type) {
            return "";
        }

        return i18n.getMessage("popup_statistics_request_types_" + type.toLowerCase());
    },

    _buildRequestTypesColumns: function (stats, range) {
        var statsData = this._selectRequestTypesStatsData(stats, range);

        var columns = {
            x: ['x'],
            values: [i18n.getMessage("popup_statistics_type_request_types")]
        };

        for (var type in stats.blockedTypes) {
            var number = statsData[stats.blockedTypes[type]] ? statsData[stats.blockedTypes[type]] : 0;

            columns.x.push(this._localizeBlockedType(type));
            columns.values.push(number);
        }

        return columns;
    },

    _renderRequestTypesGraphs: function (stats, range) {
        var columns = this._buildRequestTypesColumns(stats, range);

        var chart = c3.generate({
            size: {
                height: 230
            },
            data: {
                // columns: columns,
                x: 'x',
                columns: [
                    columns.x,
                    columns.values
                ],
                type: 'bar',
                color: function(_defaultColor, item) {
                    return ["#53C166", "#5093B0", "#FF9F14", '#D4D5D4'][item.index % 4];
                },
                labels: false
            },
            bar: {
                width: {
                    ratio: 0.5
                }
            },
            axis: {
                rotated: true,
                x: {
                    type: 'category',
                    tick: {
                        fit: true,
                        multiline: false
                    }
                },
                y: {
                    tick: {
                        rotate: 50
                    }
                }
            },
            padding: {
                right: 20
            },
            grid: {
                focus: {
                    show: false
                },
                y: {
                    'show': true
                }
            },
            tooltip: {
                grouped: true,
                contents: function(d, defaultTitleFormat, defaultValueFormat, color) {
                    d = d[0].value;
                    return '<div id="tooltip" class="chart__tooltip chart__tooltip--bar">' + d + '</div>';
                }
            },
            legend: {
                show: false
            }
        });
    },

    _renderAnalyticsBlock: function (stats, range) {
        var statsData = this._selectRequestTypesStatsData(stats, range);

        var $analytics = $('#analytics-blocked-types-values');
        $analytics.empty();

        for (var type in stats.blockedTypes) {
            var number = statsData[stats.blockedTypes[type]] ? statsData[stats.blockedTypes[type]] : 0;

            $analytics.append(
                '<li><span class="key">' + this._localizeBlockedType(type) + '</span><span class="value">' + number + '</span></li>'
            );
        }
    },

    _renderStatsGraphs: function (stats, range, type) {
        if (type === 'badRequests') {
            this._renderBadRequestsGraphs(stats, range);
        } else {
            this._renderRequestTypesGraphs(stats, range);
        }

        this._renderAnalyticsBlock(stats, range);
    },

    _renderStatsBlock: function () {
        var timeRange = $('.statistics-select-time').val();
        var typeData = $('.statistics-select-type').val();

        var self = this;
        popupPage.sendMessage({type: 'getStatisticsData'}, function (message) {
            self._renderStatsGraphs(message.stats, timeRange, typeData);
        });
    },

    _renderStats: function (container) {
        var template = this.filteringStatisticsTemplate;
        container.append(template);

        this._renderStatsBlock();
    },

    _renderActions: function (container, tabInfo) {

        if (tabInfo.urlFilteringDisabled) {
            return;
        }

        var el = $('<div>', {class: 'actions'});

        el.append(this.actionOpenAssistant);
        if (tabInfo.applicationFilteringDisabled || tabInfo.documentWhiteListed) {
            // May be show later
            this.actionOpenAssistant.hide();
        }

        el.append(this.actionOpenAbuse);
        el.append(this.actionOpenSiteReport);

        container.append(el);
    },

    _renderFooter: function (footer, tabInfo) {
        if (tabInfo.adguardDetected) {
            footer.append(this.footerIntegration);
        } else {
            footer.append(this.footerDefault);
        }
    },

    _bindAction: function (parentElement, selector, eventName, handler) {
        var element = parentElement.querySelector(selector);
        if (element) {
            element.addEventListener(eventName, handler);
        }
    },

    _bindActions: function () {

        var parent = document.querySelector('.widjet-popup');

        if (this.actionsBind === true) {
            return;
        }
        this.actionsBind = true;

        var self = this;
        this._bindAction(parent, '.siteReport', 'click', function (e) {
            e.preventDefault();
            self.openSiteReportTab(self.tabInfo.url);
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openSettings', 'click', function (e) {
            e.preventDefault();
            self.openSettingsTab();
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openAssistant', 'click', function (e) {
            e.preventDefault();
            self.openAssistantInTab();
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openFilteringLog', 'click', function (e) {
            e.preventDefault();
            self.openFilteringLog();
            popupPage.closePopup();
        });
        this._bindAction(parent, '.resetStats', 'click', function (e) {
            e.preventDefault();
            self.resetBlockedAdsCount();
            parent.querySelector('.w-popup-filter-title-blocked-all').textContent = '0';
        });
        this._bindAction(parent, '.openLink', 'click', function (e) {
            e.preventDefault();
            self.openLink(e.currentTarget.href);
            popupPage.closePopup();
        });
        this._bindAction(parent, '.openAbuse', 'click', function (e) {
            e.preventDefault();
            self.openAbuseTab(self.tabInfo.url);
            popupPage.closePopup();
        });

        // checkbox
        this._bindAction(parent, '.changeDocumentWhiteListed', 'click', function (e) {
            e.preventDefault();
            var tabInfo = self.tabInfo;
            if (tabInfo.urlFilteringDisabled || tabInfo.applicationFilteringDisabled) {
                return;
            }
            if (!tabInfo.canAddRemoveRule) {
                return;
            }
            var isWhiteListed = tabInfo.documentWhiteListed;
            if (isWhiteListed) {
                self.removeWhiteListDomain(tabInfo.url);
                isWhiteListed = false;
            } else {
                self.addWhiteListDomain(tabInfo.url);
                isWhiteListed = true;
            }
            tabInfo.documentWhiteListed = isWhiteListed;
            tabInfo.userWhiteListed = isWhiteListed;
            self._renderPopup(tabInfo);
            self.resizePopupWindow();

            if (tabInfo.adguardDetected) {
                popupPage.closePopup();
            }
        });

        function changeProtectionState(disabled) {
            var tabInfo = self.tabInfo;
            if (tabInfo.applicationFilteringDisabled == disabled) {
                return;
            }
            self.changeApplicationFilteringDisabled(disabled);
            tabInfo.applicationFilteringDisabled = disabled;
            self._renderPopup(tabInfo);
            self.resizePopupWindow();
        }

        // Disable filtering
        this._bindAction(parent, '.changeProtectionStateDisable', 'click', function (e) {
            e.preventDefault();
            changeProtectionState(true);
        });

        // Enable filtering
        this._bindAction(parent, '.changeProtectionStateEnable', 'click', function (e) {
            e.preventDefault();
            changeProtectionState(false);
        });

        // Tabs
        parent.querySelectorAll('.tabbar .tab').forEach(function (t) {
            t.addEventListener('click', function (e) {
                e.preventDefault();

                parent.querySelectorAll('.tabbar .tab').forEach(function (tab) {
                    tab.classList.remove('active');
                });
                e.target.classList.add('active');

                var attr = e.target.getAttribute('tab-switch');
                parent.querySelectorAll('.tab-switch-tab').forEach(function (tab) {
                    tab.style.display = 'none';
                });
                parent.querySelector('.tab-switch-tab[tab-switch="' + attr + '"]').style.display = 'block';
            });
        });

        // Stats filters
        parent.querySelector('.statistics-select-time').addEventListener('change', function () {
            self._renderStatsBlock();
        });
        parent.querySelector('.statistics-select-type').addEventListener('change', function () {
            self._renderStatsBlock();
        });

        parent.querySelector('.show-full-stats').addEventListener('click', function () {
            document.querySelector('.analytics').style.display = 'block';
        });

        parent.querySelector('.hide-full-stats').addEventListener('click', function () {
            document.querySelector('.analytics').style.display = 'none';
        });
    },

    // http://jira.performix.ru/browse/AG-3474
    resizePopupWindowForMacOs: function () {
        var options = this.options;
        if (options.isFirefoxBrowser || !options.isMacOs) {
            return;
        }
        setTimeout(function () {
            var block = document.querySelector(".macoshackresize");
            block.style["padding-top"] = "4px";
        }, 1000);
    }
};

(function () {

    /**
     * TODO: check the following EDGE issue
     * https://github.com/AdguardTeam/AdguardBrowserExtension/issues/551
     * MS Edge unexpectedly crashes on opening the popup.
     * We do not quite understand the reason for this behavior, but we assume it happens due to code flow execution and changing the DOM.
     * setTimeout allows us to resolve this "race condition".
     */

    var controller = new PopupController();
    controller.afterRender = function () {
        // Add some delay for show popup size properly
        // https://github.com/AdguardTeam/AdguardBrowserExtension/issues/505
        var timeout = 10;
        setTimeout(function () {
            controller.resizePopupWindow();
            controller.resizePopupWindowForMacOs();
        }, timeout);
    };

    document.addEventListener('resizePopup', function () {
        controller.resizePopupWindow();
    });

    popupPage.sendMessage({type: 'getTabInfoForPopup'}, function (message) {
        var onDocumentReady = function () {
            controller.render(message.frameInfo, message.options);
        };

        if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
            onDocumentReady();
        } else {
            document.addEventListener('DOMContentLoaded', onDocumentReady);
        }
    });

})();
