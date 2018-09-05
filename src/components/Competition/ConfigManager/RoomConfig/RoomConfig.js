import React, { Component } from 'react';

import RoomName from '../../../common/RoomName/RoomName';
import ZeroablePositiveIntegerInput from '../../../common/ZeroablePositiveIntegerInput/ZeroablePositiveIntegerInput';
import { setIn } from '../../../../logic/utils';
import { getExtensionData, setExtensionData } from '../../../../logic/wcif-extensions';

export default class RoomConfig extends Component {
  get roomData() {
    return getExtensionData('Room', this.props.room) || { stations: null };
  }

  handleInputChange = (event, value) => {
    const { room, onChange } = this.props;
    onChange(
      setExtensionData('Room', room, setIn(
        this.roomData, [event.target.name], value)
      )
    );
  };

  render() {
    const { room, disabled } = this.props;

    return (
      <div>
        <RoomName room={room} />
        <ZeroablePositiveIntegerInput
          label="Timing stations"
          value={this.roomData.stations}
          name="stations"
          onChange={this.handleInputChange}
          disabled={disabled}
        />
      </div>
    );
  }
}
