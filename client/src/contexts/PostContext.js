import React from 'react'
import axios from 'axios'
import AuthContext from './AuthContext'

const Context = React.createContext()

const service = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  withCredentials: true,
})

export class PostContext extends React.Component {
    static contextType = AuthContext
   
    state = {
        feedPosts: [],
        userPosts: [],
        mapsPost: [],
        mapsPostCopy: [],
        mapActiveCategories: [],
      };

      getFeedPosts = async () => {
           try {
            const feedPosts = await service.get('/post/all')
            console.log(feedPosts.data)
            this.setState({ feedPosts: feedPosts.data })
            return feedPosts.data
           } catch(err){
               console.log(err)
           }
      }

      getUserPosts = async userId => {
        try {
            const userPosts = await service.get(`/post/user/${userId}`)
            this.setState({ userPosts: userPosts.data })
        }
        catch(err){
            console.log(err)
        }
    }

    getMapPosts = async () => {
        try {
         const mapPosts = await service.get('/post/all/spot')
         console.log(mapPosts.data)
         this.setState({ 
             mapsPost: mapPosts.data,
             mapsPostCopy: mapPosts.data
          })
         return mapPosts.data
        } catch(err){
            console.log(err)
        }
   }

      
    createPost = async (content, mediaArray, location, categories) => {

        try {
            await service.post('/post/new', {
                content,
                mediaArray,
                location,
                categories
              })
        } catch(err){
            console.log(err)
        }
    }

      likePost = async postId => {
        try {
            await service.post(`/post/like/${postId}`)
        } catch(err){
            console.log(err)
        }
       }

       commentPost = async (postId, content) => {
        try {
            await service.post(`/post/${postId}/comment`, { content })
        } catch(err){
            console.log(err)
      }
    }
  
    getSinglePost = async postId => {
        try {
            const post = await service.get(`/post/${postId}`)
            return post.data
        } catch(err){
            console.log(err)
        }
    }

    filterOnMarkerClick = id => {
        const filteredPosts = this.state.mapsPostCopy.filter(post => {
          if(post.spot && post.spot.placeId == id){ 
           return post
          }
        })
        this.setState({ mapsPost: filteredPosts })
     }

     filterMapCategories = categories => {
         console.log(categories)
     }

  render(){
    const { feedPosts, userPosts, mapsPost, mapsPostCopy } = this.state
    const { getFeedPosts, getUserPosts, getMapPosts, createPost, likePost, commentPost, getSinglePost, filterOnMarkerClick, filterMapCategories } = this
      return(
          <Context.Provider 
              value={{ 
                  ...this.state, 
                  feedPosts, 
                  userPosts, 
                  mapsPost,
                  mapsPostCopy,
                  getFeedPosts, 
                  getUserPosts,
                  getMapPosts, 
                  createPost, 
                  likePost, 
                  commentPost,
                  getSinglePost,
                  filterOnMarkerClick,
                  filterMapCategories  }}>

              {this.props.children}
          </Context.Provider>
      )
  }
}

export default Context



