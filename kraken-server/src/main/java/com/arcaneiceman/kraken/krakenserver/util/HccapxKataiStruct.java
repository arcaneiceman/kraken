package com.arcaneiceman.kraken.krakenserver.util;

import io.kaitai.struct.ByteBufferKaitaiStream;
import io.kaitai.struct.KaitaiStream;
import io.kaitai.struct.KaitaiStruct;

import java.io.IOException;
import java.util.ArrayList;


/**
 * Native format of Hashcat password "recovery" utility
 *
 * @see <a href="https://hashcat.net/wiki/doku.php?id=hccapx">Source</a>
 */
public class HccapxKataiStruct extends KaitaiStruct {

    private ArrayList<HccapxRecord> records;
    private HccapxKataiStruct _root;
    private KaitaiStruct _parent;

    public HccapxKataiStruct(KaitaiStream _io) {
        this(_io, null, null);
    }

    public HccapxKataiStruct(KaitaiStream _io, KaitaiStruct _parent) {
        this(_io, _parent, null);
    }

    public HccapxKataiStruct(KaitaiStream _io, KaitaiStruct _parent, HccapxKataiStruct _root) {
        super(_io);
        this._parent = _parent;
        this._root = _root == null ? this : _root;
        _read();
    }

    public static HccapxKataiStruct fromFile(String fileName) throws IOException {
        return new HccapxKataiStruct(new ByteBufferKaitaiStream(fileName));
    }

    private void _read() {
        this.records = new ArrayList<HccapxRecord>();
        {
            int i = 0;
            while (!this._io.isEof()) {
                this.records.add(new HccapxRecord(this._io, this, _root));
                i++;
            }
        }
    }

    public ArrayList<HccapxRecord> records() {
        return records;
    }

    public HccapxKataiStruct _root() {
        return _root;
    }

    public KaitaiStruct _parent() {
        return _parent;
    }

    public static class HccapxRecord extends KaitaiStruct {
        private byte[] magic;
        private long version;
        private boolean ignoreReplayCounter;
        private long messagePair;
        private int lenEssid;
        private byte[] essid;
        private byte[] padding1;
        private int keyver;
        private byte[] keymic;
        private byte[] macAp;
        private byte[] nonceAp;
        private byte[] macStation;
        private byte[] nonceStation;
        private int lenEapol;
        private byte[] eapol;
        private byte[] padding2;
        private HccapxKataiStruct _root;
        private HccapxKataiStruct _parent;

        public HccapxRecord(KaitaiStream _io) {
            this(_io, null, null);
        }

        public HccapxRecord(KaitaiStream _io, HccapxKataiStruct _parent) {
            this(_io, _parent, null);
        }

        public HccapxRecord(KaitaiStream _io, HccapxKataiStruct _parent, HccapxKataiStruct _root) {
            super(_io);
            this._parent = _parent;
            this._root = _root;
            _read();
        }

        public static HccapxRecord fromFile(String fileName) throws IOException {
            return new HccapxRecord(new ByteBufferKaitaiStream(fileName));
        }

        private void _read() {
            this.magic = this._io.ensureFixedContents(new byte[]{72, 67, 80, 88});
            this.version = this._io.readU4le();
            this.ignoreReplayCounter = this._io.readBitsInt(1) != 0;
            this.messagePair = this._io.readBitsInt(7);
            this._io.alignToByte();
            this.lenEssid = this._io.readU1();
            this.essid = this._io.readBytes(lenEssid());
            this.padding1 = this._io.readBytes((32 - lenEssid()));
            this.keyver = this._io.readU1();
            this.keymic = this._io.readBytes(16);
            this.macAp = this._io.readBytes(6);
            this.nonceAp = this._io.readBytes(32);
            this.macStation = this._io.readBytes(6);
            this.nonceStation = this._io.readBytes(32);
            this.lenEapol = this._io.readU2le();
            this.eapol = this._io.readBytes(lenEapol());
            this.padding2 = this._io.readBytes((256 - lenEapol()));
        }

        public byte[] magic() {
            return magic;
        }

        /**
         * The version number of the .hccapx file format.
         */
        public long version() {
            return version;
        }

        /**
         * Indicates if the message pair matching was done based on
         * replay counter or not.
         * <p>
         * Whenever it was set to 1 it means that the replay counter
         * was ignored (i.e. it was not considered at all by the
         * matching algorithm).
         * <p>
         * Hashcat currently does not perform any particular action
         * based on this bit, but nonetheless this information could be
         * crucial for some 3th party tools and for
         * analysis/statistics. There could be some opportunity to
         * implement some further logic based on this particular
         * information also within hashcat (in the future).
         */
        public boolean ignoreReplayCounter() {
            return ignoreReplayCounter;
        }

        /**
         * The message_pair value describes which messages of the 4-way
         * handshake were combined to form the .hccapx structure. It is
         * always a pair of 2 messages: 1 from the AP (access point)
         * and 1 from the STA (client).
         * <p>
         * Furthermore, the message_pair value also gives a hint from
         * which of the 2 messages the EAPOL origins. This is
         * interesting data, but not necessarily needed for hashcat to
         * be able to crack the hash.
         * <p>
         * On the other hand, it could be very important to know if
         * “only” message 1 and message 2 were captured or if for
         * instance message 3 and/or message 4 were captured too. If
         * message 3 and/or message 4 were captured it should be a hard
         * evidence that the connection was established and that the
         * password the client used was the correct one.
         */
        public long messagePair() {
            return messagePair;
        }

        public int lenEssid() {
            return lenEssid;
        }

        public byte[] essid() {
            return essid;
        }

        public byte[] padding1() {
            return padding1;
        }

        /**
         * The flag used to distinguish WPA from WPA2 ciphers. Value of
         * 1 means WPA, other - WPA2.
         */
        public int keyver() {
            return keyver;
        }

        /**
         * The final hash value. MD5 for WPA and SHA-1 for WPA2
         * (truncated to 128 bit).
         */
        public byte[] keymic() {
            return keymic;
        }

        /**
         * The BSSID (MAC address) of the access point.
         */
        public byte[] macAp() {
            return macAp;
        }

        /**
         * Nonce (random salt) generated by the access point.
         */
        public byte[] nonceAp() {
            return nonceAp;
        }

        /**
         * The MAC address of the client connecting to the access point.
         */
        public byte[] macStation() {
            return macStation;
        }

        /**
         * Nonce (random salt) generated by the client connecting to the access point.
         */
        public byte[] nonceStation() {
            return nonceStation;
        }

        /**
         * The length of the EAPOL data.
         */
        public int lenEapol() {
            return lenEapol;
        }

        public byte[] eapol() {
            return eapol;
        }

        public byte[] padding2() {
            return padding2;
        }

        public HccapxKataiStruct _root() {
            return _root;
        }

        public HccapxKataiStruct _parent() {
            return _parent;
        }
    }
}