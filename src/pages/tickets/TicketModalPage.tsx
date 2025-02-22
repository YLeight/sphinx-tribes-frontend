import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { Modal } from 'components/common';
import { colors } from 'config';
import { useIsMobile } from 'hooks';
import { observer } from 'mobx-react-lite';
import FocusedView from '../../people/main/FocusView';
import { widgetConfigs } from '../../people/utils/Constants';
import { AlreadyDeleted } from '../../components/common/AfterDeleteNotification/AlreadyDeleted';
import { useStores } from '../../store';
import { PersonBounty } from '../../store/main';

const color = colors['light'];
const focusedDesktopModalStyles = widgetConfigs.wanted.modalStyle;

type Props = {
  setConnectPerson: (p: any) => void;
  visible?: boolean;
};

export const TicketModalPage = observer(({ setConnectPerson }: Props) => {
  const location = useLocation();
  const { main, modals, ui } = useStores();

  const history = useHistory();
  const [connectPersonBody, setConnectPersonBody] = useState<any>();
  // eslint-disable-next-line no-unused-vars
  const [publicFocusIndex, setPublicFocusIndex] = useState(0);
  const [removeNextAndPrev, setRemoveNextAndPrev] = useState(false);
  const { bountyId } = useParams<{ bountyId: string }>();
  const [activeBounty, setActiveBounty] = useState<PersonBounty[]>([]);
  const [visible, setVisible] = useState(false);
  const [isDeleted, setisDeleted] = useState(false);

  let orgUuid = '';
  if (location.state) {
    const locationState: any = location.state;
    orgUuid = locationState?.activeOrg;
    main.setActiveOrg(orgUuid);
  }

  const isMobile = useIsMobile();

  const search = useMemo(() => {
    const s = new URLSearchParams(location.search);
    return {
      owner_id: s.get('owner_id'),
      created: s.get('created')
    };
  }, [location.search]);

  const { activeOrg } = main;

  const getBounty = useCallback(async () => {
    let bounty;
    let bountyIndex = 0;

    if (bountyId) {
      bounty = await main.getBountyById(Number(bountyId));
      bountyIndex = await main.getBountyIndexById(Number(bountyId));
    } else if (search && search.created) {
      bounty = await main.getBountyByCreated(Number(search.created));
      bountyIndex = await main.getBountyIndexById(Number(search.created));
    }

    const connectPerson = bounty && bounty.length ? bounty[0].person : [];

    setPublicFocusIndex(bountyIndex);
    setConnectPersonBody(connectPerson);

    const visible = bounty && bounty.length > 0;
    const isDeleted = bounty && bounty.length === 0;
    setisDeleted(isDeleted);
    setActiveBounty(bounty);

    setVisible(visible);
  }, [bountyId, main, search]);

  useEffect(() => {
    getBounty();
  }, [getBounty, removeNextAndPrev]);

  const isDirectAccess = useCallback(() => !document.referrer, [location.pathname]);

  const goBack = () => {
    setVisible(false);
    setisDeleted(false);

    if (isDirectAccess() && !activeOrg) {
      history.push('/bounties');
    } else {
      history.goBack();
    }

    // set the active org to an empty string before closing
    main.setActiveOrg('');
  };

  const prevArrHandler = async () => {
    const { created } = activeBounty[0].body;
    if (activeOrg) {
      try {
        const bountyId = await main.getOrganizationNextBountyByCreated(activeOrg, created);
        history.replace(`/bounty/${bountyId}`);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const bountyId = await main.getNextBountyByCreated(created);
        history.replace(`/bounty/${bountyId}`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const nextArrHandler = async () => {
    const { created } = activeBounty[0].body;
    if (activeOrg) {
      try {
        const bountyId = await main.getOrganizationPreviousBountyByCreated(activeOrg, created);
        history.replace(`/bounty/${bountyId}`);
      } catch (e) {
        console.error(e);
      }
    } else {
      try {
        const bountyId = await main.getPreviousBountyByCreated(created);
        history.replace(`/bounty/${bountyId}`);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isMobile) {
    return (
      <>
        {isDeleted ? (
          <Modal visible={isDeleted} fill={true}>
            <AlreadyDeleted
              onClose={function (): void {
                throw new Error('Function not implemented.');
              }}
              isDeleted={true}
            />
          </Modal>
        ) : (
          visible && (
            <Modal visible={visible} fill={true}>
              <FocusedView
                person={connectPersonBody}
                personBody={connectPersonBody}
                canEdit={false}
                selectedIndex={publicFocusIndex}
                config={widgetConfigs.wanted}
                bounty={activeBounty}
                fromBountyPage={true}
                goBack={goBack}
              />
            </Modal>
          )
        )}
      </>
    );
  }

  return (
    <>
      {isDeleted ? (
        <Modal
          visible={isDeleted}
          envStyle={{
            background: color.pureWhite,
            ...focusedDesktopModalStyles,

            right: '-50px',
            borderRadius: '50%'
          }}
        >
          <AlreadyDeleted onClose={goBack} isDeleted={true} />
        </Modal>
      ) : (
        visible && (
          <Modal
            visible={visible}
            envStyle={{
              background: color.pureWhite,
              ...focusedDesktopModalStyles,
              maxHeight: '100vh',
              zIndex: 20
            }}
            style={{
              background: 'rgba( 0 0 0 /75% )'
            }}
            overlayClick={goBack}
            bigCloseImage={goBack}
            bigCloseImageStyle={{
              top: '18px',
              right: '-50px',
              borderRadius: '50%'
            }}
            prevArrowNew={removeNextAndPrev ? undefined : prevArrHandler}
            nextArrowNew={removeNextAndPrev ? undefined : nextArrHandler}
          >
            <FocusedView
              setRemoveNextAndPrev={setRemoveNextAndPrev}
              person={connectPersonBody}
              personBody={connectPersonBody}
              canEdit={false}
              selectedIndex={publicFocusIndex}
              config={widgetConfigs.wanted}
              goBack={goBack}
              bounty={activeBounty}
              fromBountyPage={true}
              extraModalFunction={() => {
                goBack();
                if (ui.meInfo) {
                  setConnectPerson(connectPersonBody);
                } else {
                  modals.setStartupModal(true);
                }
              }}
            />
          </Modal>
        )
      )}
    </>
  );
});
