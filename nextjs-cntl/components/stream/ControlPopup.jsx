import Router from 'next/router';

const ControlPopup = (props) => {

  const logout = () => {
    disconnect();
    Router.push('/auth/signout');
  }

  const kickPlayer = () => {
    if (props.role === 'ROLE_ADMIN') {
      return (
        <div id="KickOthers">
          <div className="settings-text">Kick all other players</div>
          <label className="btn-overlay">
            <input type="button" id="kick-other-players-button" className="overlay-button btn-flat" value="Kick" />
          </label>
        </div>
      )
    }
  }

  const fillWindow = () => {
    return (
      <div id="FillWindow">
        <div className="settings-text">Enlarge Display to Fill Window</div>
        <label className="tgl-switch">
          <input type="checkbox" id="enlarge-display-to-fill-window-tgl" className="tgl tgl-flat" defaultChecked />
          <div className="tgl-slider"></div>
        </label>
      </div>
    )
  }

  const qualityControlOwnership = () => {
    return (
      <div id="QualityControlOwnership">
        <div className="settings-text">Quality control ownership</div>
        <label className="tgl-switch">
          <input type="checkbox" id="quality-control-ownership-tgl" className="tgl tgl-flat" />
          <div className="tgl-slider"></div>
        </label>
      </div>
    )
  }

  const statsSetting = () => {
    return (
      <div id="statsSetting">
        <div className="settings-text">Show Stats</div>
        <label className="tgl-switch">
          <input type="checkbox" id="show-stats-tgl" className="tgl tgl-flat" />
          <div className="tgl-slider"></div>
        </label>
        <div id="statsContainer">
          <div id="stats"></div>
        </div>
      </div>
    )
  }

  return (
    <div id="overlay" className="overlay">
      <div id="overlayButton">+</div>
      <div id="overlaySettings">
        {kickPlayer()}
        {fillWindow()}
        {qualityControlOwnership()}
        {statsSetting()}
        <div id="Logout">
          <div className="settings-text">Logout</div>
          <label className="btn-overlay">
            {/* <input type="button" id="logout" className="overlay-button btn-flat" value="-" /> */}
            <button onClick={logout}>-</button>
          </label>
        </div>
      </div>
    </div>
  )
}

export default ControlPopup;