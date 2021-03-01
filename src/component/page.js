import React, { Component } from 'react';
import { Button, Row, Col } from 'antd';

import 'antd/dist/antd.css';
import './page.css';

// 自增 id
let id = 0;

// 否则会触发多个 dragStart 事件
let currentDragElementId;

class Page extends Component {
  state = {
    json: {
      id: `Container-${++id}`,
      type: 'Container',
      elements: [],
    },
  }

  addControl = (controlType, container) => {
    switch (controlType) {
      case 'Button':
        container.elements.push({
          id: `Button-${++id}`,
          type: 'Button',
          parentId: container.id,
        });
        return;

      case 'Container':
        container.elements.push({
          id: `Container-${++id}`,
          type: 'Container',
          elements: [],
          parentId: container.id,
        });
        return;

      default:
        throw new Error(`暂未实现的 controlType: ${controlType}`);
    }
  };

  // 递归查找，删除指定 id 的元素
  removeControl = (id, container) => {
    const {
      removeControl,
    } = this;

    console.log(`remove ${id} from container: ${JSON.stringify(container, null, 2)}`);

    let isFound = false;
    container.elements = container.elements.reduce((memo, element) => {
      if (element.id === id) {
        isFound = true;
        return memo;
      }

      memo.push(element);
      return memo;
    }, []);

    if (isFound) {
      return;
    }

    container.elements.forEach(element => {
      if (element.elements == null) {
        return;
      }

      removeControl(id, element);
    });
  };

  // 递归渲染
  renderJson = (node, originJson, callback) => {
    const {
      addControl,
      removeControl,
      renderJson,
      state: { json },
    } = this;
    console.log(`render node: ${JSON.stringify(node, null, 2)}`);

    switch (node.type) {
      case 'Container':
        return <Row className="container" draggable id={node.id}

          onDragStart={
            e => {
              // 如果当前已经有一个拖拽了，就不重新触发新的拖拽
              if (currentDragElementId != null) {
                console.log(`there is another drag element: ${currentDragElementId}`);
                return;
              }

              const id = e.target.getAttribute('id');
              const parentId = node.parentId;
              const message = {
                dragType: 'Remove',
                controlType: 'Container',
                id,
                parentId,
              };
              e.dataTransfer.setData('type', JSON.stringify(message));

              // 设置当前正在 drag 的元素
              currentDragElementId = id;

              console.log(`drag container "${id}", send message: ${JSON.stringify(message, null, 2)}`);
            }
          }

          onDragOver={
            e => {
              e.preventDefault();

              // 设置接收状态，否则会有多个区域同时接收
              e.target.setAttribute('data-receive', true);
            }
          }

          onDragLeave={
            e => {

              // 移除接收状态
              e.target.removeAttribute('data-receive');
            }
          }

          onDrop={
            e => {

              // 如果当前区域不是可接收区域，就不处理
              if (e.target.getAttribute('data-receive') == null) {
                return;
              }

              // 清空当前 drop 的元素状态
              currentDragElementId = null;

              const rawMessage = e.dataTransfer.getData('type');
              const message = JSON.parse(rawMessage);
              const { dragType, controlType, id } = message;

              const containerId = node.id;
              console.log(`drop to "${containerId}", receive message: ${JSON.stringify(message, null, 2)}`);

              // 从控件区拖拽的逻辑
              if (dragType === 'Add') {
                addControl(controlType, node);
                callback();

                // 当前区域变成不接收状态
                e.target.removeAttribute('data-receive');
                return;
              }

              // 区域中进行拖拽的逻辑，先删除再添加
              // todo: 删除容器时，连同里面的元素也会被删除
              if (dragType === 'Remove') {
                removeControl(id, json);
                callback();

                addControl(controlType, node);
                callback();

                // 当前区域变成不接收状态
                e.target.removeAttribute('data-receive');
                return;
              }

              throw new Error(`unimplement dragType: ${dragType}`);
            }
          }
        >
          {
            node.elements.length === 0
              ? <Col span="24"></Col>
              : node.elements.map(element => <Col key={element.id} span="24">
                {
                  renderJson(element, originJson, callback)
                }
              </Col>)
          }
        </Row>;

      case 'Button':
        return <Button draggable id={node.id}

          onDragStart={
            e => {
              // 如果当前已经有一个拖拽了，就不重新触发新的拖拽
              if (currentDragElementId != null) {
                console.log(`there is another drag element: ${currentDragElementId}`);
                return;
              }

              const id = e.target.getAttribute('id');
              const parentId = node.parentId;
              const message = {
                dragType: 'Remove',
                controlType: 'Button',
                id,
                parentId,
              };
              e.dataTransfer.setData('type', JSON.stringify(message));

              // 设置当前正在 drag 的元素
              currentDragElementId = id;

              console.log(`drag button "${id}", send message: ${JSON.stringify(message, null, 2)}`);
            }
          }> test</Button >;

      default:
        throw new Error(`unimplement controlType: ${node.type}`);
    }
  };

  render() {
    const {
      renderJson,
      state: { json },
    } = this;

    return (
      <div className="app">

        {/* 控件区 */}
        <div>
          <Button draggable
            onDragStart={
              e => {
                e.dataTransfer.setData('type', JSON.stringify({
                  dragType: 'Add',
                  controlType: 'Button',
                }));
              }
            }>控件</Button>
          <Button draggable
            onDragStart={
              e => {
                e.dataTransfer.setData('type', JSON.stringify({
                  dragType: 'Add',
                  controlType: 'Container',
                }));
              }
            }>容器</Button>
        </div>

        {/* 工作台 */}
        {renderJson(json, json, () => {
          console.log(`modify state: ${JSON.stringify(json, null, 2)}`);

          this.setState({
            json,
          });
        })}
      </div>
    );
  }
}

export default Page;
