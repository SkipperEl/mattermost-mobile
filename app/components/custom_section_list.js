// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.
import React from 'react';
import PropTypes from 'prop-types';
import {
    Platform,
    SectionList,
    Text,
    View,
} from 'react-native';

import Loading from 'app/components/loading';
import FormattedText from 'app/components/formatted_text';
import {makeStyleSheetFromTheme, changeOpacity} from 'app/utils/theme';

export default class CustomSectionList extends React.PureComponent {
    static propTypes = {

        /*
         * The current theme.
         */
        theme: PropTypes.object.isRequired,

        /*
         * An array of items to be rendered.
         */
        items: PropTypes.array.isRequired,

        /*
         * A function or React element used to render the items in the list.
         */
        renderItem: PropTypes.func,

        /*
         * Whether or not to render "No results" when the list contains no items.
         */
        showNoResults: PropTypes.bool,

        /*
         * A function to get a section identifier for each item in the list. Items sharing a section identifier will be grouped together.
         */
        sectionKeyExtractor: PropTypes.func.isRequired,

        /*
         * A comparison function used when sorting items in the list.
         */
        compareItems: PropTypes.func.isRequired,

        /*
         * A function to get a unique key for each item in the list. If not provided, the id field of the item will be used as the key.
         */
        keyExtractor: PropTypes.func,

        /*
         * Any extra data needed to render the list. If this value changes, all items of a list will be re-rendered.
         */
        extraData: PropTypes.object,

        /*
         * A function called when an item in the list is pressed. Receives the item that was pressed as an argument.
         */
        onRowPress: PropTypes.func,

        /*
         * A function called when the end of the list is reached. This can be triggered before this list end is reached
         * by changing onListEndReachedThreshold.
         */
        onListEndReached: PropTypes.func,

        /*
         * How soon before the end of the list onListEndReached should be called.
         */
        onListEndReachedThreshold: PropTypes.number,

        /*
         * Whether or not to display the loading text.
         */
        loading: PropTypes.bool,

        /*
         * The text displayed when loading is set to true.
         */
        loadingText: PropTypes.object,

        /*
         * How many items to render when the list is first rendered.
         */
        initialNumToRender: PropTypes.number,
    };

    static defaultProps = {
        showNoResults: true,
        keyExtractor: (item) => {
            return item.id;
        },
        onListEndReached: () => true,
        onListEndReachedThreshold: 50,
        loadingText: null,
        initialNumToRender: 10,
    };

    constructor(props) {
        super(props);

        this.state = {
            sections: this.extractSections(props.items),
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.items !== this.props.items) {
            this.setState({
                sections: this.extractSections(nextProps.items),
            });
        }
    }

    extractSections = (items) => {
        const sections = {};
        const sectionKeys = [];
        for (const item of items) {
            const sectionKey = this.props.sectionKeyExtractor(item);

            if (!sections[sectionKey]) {
                sections[sectionKey] = [];
                sectionKeys.push(sectionKey);
            }

            sections[sectionKey].push(item);
        }

        sectionKeys.sort();

        return sectionKeys.map((sectionKey) => {
            return {
                key: sectionKey,
                data: sections[sectionKey].sort(this.props.compareItems),
            };
        });
    }

    renderSectionHeader = ({section}) => {
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        return (
            <View style={style.sectionWrapper}>
                <View style={style.sectionContainer}>
                    <Text style={style.sectionText}>{section.key}</Text>
                </View>
            </View>
        );
    };

    renderItem = ({item}) => {
        const props = {
            id: item.id,
            item,
            onPress: this.props.onRowPress,
        };

        // Allow passing in a component like UserListRow or ChannelListRow
        if (this.props.renderItem.prototype.isReactElement) {
            const RowComponent = this.props.renderItem;
            return <RowComponent {...props}/>;
        }

        return this.props.renderItem(props);
    };

    renderItemSeparator = () => {
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        return (
            <View style={style.separator}/>
        );
    };

    renderFooter = () => {
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        if (!this.props.loading || !this.props.loadingText) {
            return null;
        }

        if (this.props.items.length === 0) {
            return null;
        }

        return (
            <View style={style.loading}>
                <FormattedText
                    {...this.props.loadingText}
                    style={style.loadingText}
                />
            </View>
        );
    };

    renderEmptyList = () => {
        const {theme} = this.props;
        const style = getStyleFromTheme(theme);

        if (this.props.loading) {
            return (
                <View
                    style={style.searching}
                >
                    <Loading/>
                </View>
            );
        }

        if (this.props.showNoResults) {
            return (
                <View style={style.noResultContainer}>
                    <FormattedText
                        id='mobile.custom_list.no_results'
                        defaultMessage='No Results'
                        style={style.noResultText}
                    />
                </View>
            );
        }

        return null;
    }

    render() {
        const style = getStyleFromTheme(this.props.theme);

        return (
            <SectionList
                style={style.listView}
                initialNumToRender={this.props.initialNumToRender}
                renderSectionHeader={this.renderSectionHeader}
                ItemSeparatorComponent={this.renderItemSeparator}
                ListFooterComponent={this.renderFooter}
                ListEmptyComponent={this.renderEmptyList}
                onEndReached={this.props.onListEndReached}
                onEndReachedThreshold={this.props.onListEndReachedThreshold}
                extraData={this.props.extraData}
                sections={this.state.sections}
                keyExtractor={this.props.keyExtractor}
                renderItem={this.renderItem}
                keyboardShouldPersistTaps='handled'
            />
        );
    }
}

const getStyleFromTheme = makeStyleSheetFromTheme((theme) => {
    return {
        listView: {
            ...Platform.select({
                android: {
                    marginBottom: 20,
                },
            }),
        },
        loading: {
            height: 70,
            backgroundColor: theme.centerChannelBg,
            alignItems: 'center',
            justifyContent: 'center',
        },
        loadingText: {
            color: changeOpacity(theme.centerChannelColor, 0.6),
        },
        searching: {
            backgroundColor: theme.centerChannelBg,
            height: '100%',
            position: 'absolute',
            width: '100%',
        },
        sectionContainer: {
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.07),
            paddingLeft: 10,
            paddingVertical: 2,
        },
        sectionWrapper: {
            backgroundColor: theme.centerChannelBg,
        },
        sectionText: {
            fontWeight: '600',
            color: theme.centerChannelColor,
        },
        separator: {
            height: 1,
            flex: 1,
            backgroundColor: changeOpacity(theme.centerChannelColor, 0.1),
        },
        noResultContainer: {
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
        },
        noResultText: {
            fontSize: 26,
            color: changeOpacity(theme.centerChannelColor, 0.5),
        },
    };
});
