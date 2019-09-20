
import React, {Component} from 'react';
import ReactDOM from 'react-dom';
import {  Icon, WhiteSpace,SearchBar, PullToRefresh } from 'antd-mobile';
import axios from 'axios';
import './position.less';
import {connect} from 'react-redux'
import Tree, { TreeNode } from 'rc-tree';
import 'rc-tree/assets/index.css';
import {userLocationInformation, userSonLocation } from '../../../store/maindata';
class Position extends Component {
  state = {
    visible: false,
    selected: '',
    value: '美食',
    arrList:[],
    refreshing: false,
    down: true,
    height: document.documentElement.clientHeight,
    rootLocationData: [],
    onExpand: false
  };
  componentDidMount () {
    this.setState({
      rootLocationData: this.props.rootLocationData ? this.props.rootLocationData : []
    })
    let hei = this.state.height - ReactDOM.findDOMNode(this.ptr).offsetTop;
    setTimeout(() => this.setState({
      height: hei,
    }), 0);

  };
  // 点击返回
  handleReturn = () => {
    this.props.history.go(-1);
  }
  // 加载树结构
  renderTreeNodes = (data) => {
    return data.map((item) => {
      if (item.childNodes) {
        return (
          <TreeNode title={<span>{item.name}</span>} key={item.id} dataRef={item} isLeaf={false}>
            { this.renderSonNodes(item.childNodes) }
          </TreeNode>
        )
      }
      return (
        <TreeNode title={<span>{item.name}</span>} key={item.id} dataRef={item} isLeaf={item.isLeaf === 0 ? false : true}/>
      )
    })
  }
  // 加载子结构
  renderSonNodes = (data) => {
    let sonTree = data ? data : [];
    return sonTree.map((item) => {
      if(item.childNodes) {
        console.log(item.childNodes, '子部位');
        return (
          <TreeNode title={<span>{item.locationName}</span>} key={item.id} dataRef={item} isLeaf={item.isLeaf === 0 ? false : true}>
            { this.renderSonNodes(item.childNodes) }
          </TreeNode>
        )
      }
      return (
        <TreeNode title={<span>{item.locationName}</span>} key={item.id} dataRef={item} isLeaf={item.isLeaf === 0 ? false : true}>
        </TreeNode>
      )
    })
  }
  onSelectTreeNode(e, node){
    const {dispatch} = this.props;
    let item = node.selectedNodes[0].props.dataRef;
    console.log(node, item, '选择的问题');
    dispatch(userLocationInformation(dispatch,item,this));
    // this.props.history.push('/dosageapplication');
    this.props.history.go(-1);
  }
  onExpand =(key, node)=> {
    const { dispatch, majorGongquId, majorid  }  = this.props;
    const { rootLocationData } = this.state;
    let info = {
      workAreaId: majorGongquId,
      specialtyId: majorid,
      parentId: Number(key[key.length - 1])
    }
    let that = this;
    axios({
      method:"get",
      url:`https://zl-test.glodon.com:38001/gcsj-service/dict/dictlocation/find`,
      // url:`https://zl.glodon.com:38001/gcsj-service/dict/dictlocation/find`,
      headers:{
        'x-project-id':majorGongquId,    
      },
      params: info
    }).then(function(res){
      if(res.status === 200) {
        let sonData = res.data.result ? res.data.result : [];
        console.log(sonData, rootLocationData, '接口返回');
        let rootLocation = rootLocationData;
        rootLocation.map((item, index) => {
          if (rootLocation[index].id === Number(key[key.length - 1])){
            rootLocation[index]['childNodes'] = sonData;
            // console.log('进来1',rootLocation.childNodes, rootLocation[index].id);
            that.setState({
              rootLocationData: rootLocation
            });
          } else if(item.childNodes){
            // console.log('进来2',item.childNodes, key[key.length - 1], item.childNodes[index].id);
            let childNodes = item.childNodes;
            childNodes.map((item)=>{
              if(item.id===key[key.length - 1]) {
                item['childNodes'] = sonData;
              } else if(item.childNodes) {
                let childNodes = item.childNodes;
                childNodes.map((item)=>{
                  if(item.id===key[key.length - 1]) {
                    item['childNodes'] = sonData;
                  } else if(item.childNodes){
                    let childNodes = item.childNodes;
                    childNodes.map((item)=>{
                      if(item.id===key[key.length - 1]){
                        item['childNodes'] = sonData;
                      } else if(item.childNodes){
                        let childNodes = item.childNodes;
                        childNodes.map((item)=>{
                          if(item.id===key[key.length - 1]){
                            item['childNodes'] = sonData;
                          }
                        })
                      }
                    })
                  }
                })
              }
            })
            that.setState({
              rootLocationData: rootLocation
            })
          }
        });
      }
    })
  }
  render() {
    const { height, rootLocationData } = this.state;
    return(
      <div className="positionBox">
        <div className="inponeXBox"></div>
        <div className="positionHeader">
          <Icon type="left" className="leftIcon" onClick={this.handleReturn} />
          部位字典
        </div>
        <div className="positionContent">
          <WhiteSpace />
            <SearchBar placeholder="搜索部位名称" ref={ref => this.autoFocusInst = ref} />
            <PullToRefresh damping={60} ref={el => this.ptr =el} style={{height: height, overflow: 'auto'}} indicator={this.state.down ? {} : {deactivate: '下拉可刷新'}} direction={this.state.down ? 'down' : 'up'} refreshing={this.state.refreshing} onRefresh={()=>{this.setState({refreshing: true}); setTimeout(() => {
        this.setState({refreshing:false})
      }, 1000);}}>
          <div className="listArea">
            <Tree
                checkStrictly
                className="treeAra"
                autoExpandParent
                defaultExpandParent
                className="treeArea"
                onSelect={this.onSelectTreeNode.bind(this)}
                onExpand={this.onExpand}
            >
              {this.renderTreeNodes(rootLocationData)}
            </Tree>
          </div>
          </PullToRefresh>
        </div>
      </div>
    )
  }
}
export default connect(state => {
  return {
    rootLocationData: state.homePage.rootLocationData,
    sonLocationData: state.homePage.sonLocationData,
    majorGongquId: state.homePage.majorGongquId,
    majorid: state.homePage.majorid
  }
})(Position)


