import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { withRuntimeContext } from 'vtex.render-runtime'
import { injectIntl, intlShape } from 'react-intl'
import { Slider } from 'vtex.styleguide'

import { facetOptionShape } from '../constants/propTypes'
import { getFilterTitle, HEADER_SCROLL_OFFSET } from '../constants/SearchHelpers'
import FilterOptionTemplate from './FilterOptionTemplate'

const DEBOUNCE_TIME = 500 // ms

/** Price range slider component */
class PriceRange extends Component {
  static propTypes = {
    /** Filter title */
    title: PropTypes.string.isRequired,
    /** Available price ranges */
    options: PropTypes.arrayOf(facetOptionShape).isRequired,
    /** Intl instance */
    intl: intlShape.isRequired,
    /** Get the props to pass to render's Link */
    getLinkProps: PropTypes.func.isRequired,
    /** Price range facet type */
    type: PropTypes.string.isRequired,
    /** Runtime context */
    runtime: PropTypes.shape({
      navigate: PropTypes.func.isRequired,
      culture: PropTypes.shape({
        currency: PropTypes.string,
      }),
    }).isRequired,
    /** Current price range filter query parameter*/
    priceRange: PropTypes.string,
  }

  get currencyOptions() {
    return {
      style: 'currency',
      currency: this.props.runtime.culture.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  }

  handleChange = ([left, right]) => {
    if (this.navigateTimeoutId) {
      clearTimeout(this.navigateTimeoutId)
    }

    this.navigateTimeoutId = setTimeout(() => {
      const { type, getLinkProps, runtime: { navigate } } = this.props

      const linkProps = getLinkProps({
        slug: `${left} TO ${right}`,
        type,
      })

      navigate({
        page: linkProps.page,
        params: linkProps.params,
        query: linkProps.queryString,
        scrollOptions: { baseElementId: 'search-result-anchor', top: -HEADER_SCROLL_OFFSET },
      })
    }, DEBOUNCE_TIME)
  }

  render() {
    const { options, intl, priceRange } = this.props
    const title = getFilterTitle(this.props.title, intl)

    const slugRegex = /^de-(.*)-a-(.*)$/
    const availableOptions = options.filter(({ Slug }) => slugRegex.test(Slug))

    if (!availableOptions.length) {
      return null
    }

    let minValue = Number.MAX_VALUE
    let maxValue = Number.MIN_VALUE

    availableOptions.forEach(({ Slug }) => {
      const [_, minSlug, maxSlug] = Slug.match(slugRegex) // eslint-disable-line no-unused-vars

      const min = parseInt(minSlug)
      const max = parseInt(maxSlug)

      if (min < minValue) {
        minValue = min
      }
      if (max > maxValue) {
        maxValue = max
      }
    })

    const defaultValues = [minValue, maxValue]
    const currentValuesRegex = /^(.*) TO (.*)$/

    if (priceRange && currentValuesRegex.test(priceRange)) {
      const [_, currentMin, currentMax] = priceRange.match(currentValuesRegex) // eslint-disable-line no-unused-vars

      defaultValues[0] = parseInt(currentMin)
      defaultValues[1] = parseInt(currentMax)
    }

    return (
      <FilterOptionTemplate title={title} collapsable={false}>
        <Slider
          min={minValue}
          max={maxValue}
          onChange={this.handleChange}
          defaultValues={defaultValues}
          formatValue={value => intl.formatNumber(value, this.currencyOptions)}
          range
        />
      </FilterOptionTemplate>
    )
  }
}

export default withRuntimeContext(injectIntl(PriceRange))
