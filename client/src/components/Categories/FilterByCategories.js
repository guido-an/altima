import '../scss/feedFilter.scss'
import React from 'react'
import CategoryContext from '../../contexts/CategoryContext'

class FilterByCategories extends React.Component {
   static contextType = CategoryContext

  componentDidMount () {
    this.context.cleanSelectedCategoriesIds()
    this.context.getCategories()
  }

  onFilterCategoryChange = async e => {
    await this.context.onSelectCategories(e)
    this.props.postContext.filterPostsOnCategoryHome()
  }

  onMyFeed = async e => {

  }

  render () {
    return (
      <div className='feed-cat'>
        <div className='onboarding'>
          <div className="item">
            <button onClick={this.onMyFeed} >My Feed</button>
          </div>
        {this.context.allCategories.map(category => {
          return (
              <div key={category._id} className='item'>
                <label className='container'>
                <input onChange={this.onFilterCategoryChange} type='checkbox' name={category._id} />
                <span className={`checkmark  ${category.name}`}>{category.name}</span>
                </label>
              </div>
          )
        })}
      </div>
      </div>
    )
  }
}

export default FilterByCategories
