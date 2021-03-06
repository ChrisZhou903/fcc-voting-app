import React, { PureComponent } from 'react'
import { object, func } from 'prop-types'
import { Link } from 'react-router-dom'
import { Row, Col, Layout, Menu, Icon, Modal } from 'antd'

import './index.css'

const { Header } = Layout

class HeaderComp extends PureComponent {
  static propTypes = {
    user: object.isRequired,
    filter: object.isRequired,
    router: object.isRequired,
    updateFilter: func.isRequired,
    push: func.isRequired,
  }

  handleFilterChange = ({ selectedKeys }) => {
    const { updateFilter, user, push } = this.props

    if (!user.id) {
      Modal.confirm({
        title: 'Should sign in first to see your votes',
        okText: 'Sign in',
        cancelText: 'Cancel',
        iconType: 'exclamation-circle',
        onOk() {
          push('/login')
        },
      })
    } else {
      const filterUserId = selectedKeys.indexOf('all-votes') > -1 ? '' : user.id

      updateFilter({
        user: filterUserId,
      })
    }
  }

  render() {
    const { user, filter, router } = this.props
    const selectedKeys = filter.user ? ['your-votes'] : ['all-votes']
    const isHomepage = router.location.pathname === '/'

    return (
      <Header className="app-header">
        <Row gutter={16}>
          <Col className="gutter-row" span={8}>
            <h1 className="header-title">
              <Link to="/">VOTING APP</Link>
            </h1>
          </Col>
          <Col className="gutter-row header-nav header-nav__middle" span={8}>
            {isHomepage && <Menu
              theme="dark"
              mode="horizontal"
              selectedKeys={selectedKeys}
              onSelect={this.handleFilterChange}
            >
              <Menu.Item key="all-votes">
                All Votes
              </Menu.Item>
              <Menu.Item key="your-votes">
                Your Votes
              </Menu.Item>
            </Menu>}
          </Col>
          <Col className="gutter-row header-nav header-nav__right" span={8}>
            {
              user.id ?
                <Menu
                  theme="dark"
                  mode="horizontal"
                >
                  <Menu.SubMenu title={<span><Icon type="user" />{user.displayName}</span>}>
                    <Menu.Item key="settings">
                      <Link to="/settings">Settings</Link>
                    </Menu.Item>
                    <Menu.Item key="logout">
                      <a href="/logout">Log out</a>
                    </Menu.Item>
                  </Menu.SubMenu>
                </Menu>
                :
                <div className="header-nav__login">
                  <Link to="/login">Sign in</Link>
                  &nbsp;&nbsp;or&nbsp;&nbsp;
                  <Link to="/join">Sign up</Link>
                </div>
            }
          </Col>
        </Row>
      </Header>
    )
  }
}

export default HeaderComp
